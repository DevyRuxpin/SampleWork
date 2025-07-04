import re
from typing import Dict, List, Optional
import requests
from packaging import version
from packaging.requirements import Requirement
import asyncio
from functools import lru_cache
import json
from datetime import datetime, timedelta
from fastapi import HTTPException
import networkx as nx
import matplotlib.pyplot as plt
import os
from fpdf import FPDF
import pandas as pd

# Cache for PyPI responses
@lru_cache(maxsize=100)
def get_pypi_data(package_name: str) -> Optional[Dict]:
    try:
        response = requests.get(f"https://pypi.org/pypi/{package_name}/json")
        if response.status_code == 200:
            return response.json()
        return None
    except Exception:
        return None

def parse_requirements(requirements_text: str) -> Dict:
    """
    Parse requirements.txt content into a structured JSON format.
    """
    requirements = []
    for line in requirements_text.split('\n'):
        line = line.strip()
        if line and not line.startswith('#'):
            try:
                req = Requirement(line)
                package_info = {
                    "name": req.name,
                    "version": str(req.specifier) if req.specifier else None,
                    "extras": list(req.extras) if req.extras else None,
                    "marker": str(req.marker) if req.marker else None
                }
                requirements.append(package_info)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid requirement: {line}. Error: {str(e)}"
                )
    
    return {"requirements": requirements}

async def get_latest_version(package_name: str) -> str:
    """
    Get the latest version of a package from PyPI asynchronously.
    """
    data = get_pypi_data(package_name)
    if data:
        return data["info"]["version"]
    return None

async def check_compatibility(requirements_text: str) -> Dict:
    """
    Check compatibility of requirements and return a report.
    """
    requirements = parse_requirements(requirements_text)["requirements"]
    tasks = [get_latest_version(req["name"]) for req in requirements]
    latest_versions = await asyncio.gather(*tasks)
    
    compatibility_report = []
    
    for req, latest_version in zip(requirements, latest_versions):
        package_name = req["name"]
        current_version = req["version"]
        
        if not latest_version:
            status = "unknown"
            message = "Could not fetch version information"
        else:
            if not current_version:
                status = "warning"
                message = f"No version specified. Latest version is {latest_version}"
            else:
                version_match = re.search(r'([\d.]+)', current_version)
                if version_match:
                    current_version = version_match.group(1)
                    if version.parse(current_version) < version.parse(latest_version):
                        status = "warning"
                        message = f"Update available: {current_version} -> {latest_version}"
                    else:
                        status = "ok"
                        message = "Up to date"
                else:
                    status = "warning"
                    message = "Could not parse version number"
        
        compatibility_report.append({
            "package": package_name,
            "current_version": current_version,
            "latest_version": latest_version,
            "status": status,
            "message": message
        })
    
    return {
        "compatibility_report": compatibility_report,
        "summary": {
            "total_packages": len(compatibility_report),
            "up_to_date": len([r for r in compatibility_report if r["status"] == "ok"]),
            "needs_update": len([r for r in compatibility_report if r["status"] == "warning"]),
            "unknown": len([r for r in compatibility_report if r["status"] == "unknown"])
        }
    }

def check_vulnerabilities(requirements_text: str) -> Dict:
    """
    Check for known vulnerabilities in packages.
    """
    requirements = parse_requirements(requirements_text)["requirements"]
    vulnerability_report = []
    
    for req in requirements:
        package_name = req["name"]
        current_version = req["version"]
        
        # In a real implementation, you would check against a vulnerability database
        # This is a placeholder for demonstration
        vulnerabilities = []
        if package_name in ["django", "flask"]:  # Example check
            vulnerabilities.append({
                "id": "CVE-2023-1234",
                "severity": "high",
                "description": "Example vulnerability description",
                "fixed_version": "2.0.0"
            })
        
        vulnerability_report.append({
            "package": package_name,
            "version": current_version,
            "vulnerabilities": vulnerabilities
        })
    
    return {
        "vulnerability_report": vulnerability_report,
        "summary": {
            "total_packages": len(vulnerability_report),
            "vulnerable_packages": len([r for r in vulnerability_report if r["vulnerabilities"]]),
            "total_vulnerabilities": sum(len(r["vulnerabilities"]) for r in vulnerability_report)
        }
    }

def check_python_compatibility(requirements_text: str, python_version_str: str) -> Dict:
    """
    Check Python version compatibility for packages.
    """
    try:
        python_version = version.parse(python_version_str)
        requirements = parse_requirements(requirements_text)["requirements"]
        compatibility_report = []
        
        for req in requirements:
            package_name = req["name"]
            data = get_pypi_data(package_name)
            
            if data:
                classifiers = data["info"].get("classifiers", [])
                python_versions = []
                
                for classifier in classifiers:
                    if classifier.startswith("Programming Language :: Python ::"):
                        ver = classifier.split("::")[-1].strip()
                        if ver and not any(x in ver.lower() for x in ["implementation", "only"]):
                            try:
                                # Extract version number from classifier
                                ver_match = re.search(r'(\d+\.\d+)', ver)
                                if ver_match:
                                    python_versions.append(ver_match.group(1))
                            except ValueError:
                                continue
                
                if python_versions:
                    is_compatible = any(
                        version.parse(python_version_str) >= version.parse(v)
                        for v in python_versions
                    )
                else:
                    is_compatible = None  # Unknown compatibility
                
                compatibility_report.append({
                    "package": package_name,
                    "python_version": python_version_str,
                    "supported_versions": python_versions,
                    "is_compatible": is_compatible if python_versions else None
                })
            else:
                compatibility_report.append({
                    "package": package_name,
                    "python_version": python_version_str,
                    "supported_versions": [],
                    "is_compatible": None
                })
        
        return {
            "compatibility_report": compatibility_report,
            "summary": {
                "total_packages": len(compatibility_report),
                "compatible_packages": len([r for r in compatibility_report if r["is_compatible"] is True]),
                "incompatible_packages": len([r for r in compatibility_report if r["is_compatible"] is False]),
                "unknown_compatibility": len([r for r in compatibility_report if r["is_compatible"] is None])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error checking Python compatibility: {str(e)}")

def generate_requirements_txt(requirements_json: Dict) -> str:
    """
    Generate requirements.txt content from JSON.
    """
    requirements = []
    for req in requirements_json.get("requirements", []):
        line = req["name"]
        if req["version"]:
            line += req["version"]
        if req["extras"]:
            line += f"[{','.join(req['extras'])}]"
        if req["marker"]:
            line += f"; {req['marker']}"
        requirements.append(line)
    
    return "\n".join(requirements)

def analyze_dependencies(requirements_text: str) -> Dict:
    """
    Analyze package dependencies and create a dependency graph.
    """
    try:
        requirements = parse_requirements(requirements_text)["requirements"]
        dependency_graph = nx.DiGraph()
        
        for req in requirements:
            package_name = req["name"]
            data = get_pypi_data(package_name)
            
            if data:
                # Add node for the package
                dependency_graph.add_node(package_name)
                
                # Get package dependencies
                requires_dist = data["info"].get("requires_dist", [])
                if requires_dist:
                    for dep in requires_dist:
                        try:
                            dep_req = Requirement(dep)
                            dependency_graph.add_edge(package_name, dep_req.name)
                        except Exception:
                            continue
        
        # Calculate metrics
        metrics = {
            "total_packages": len(dependency_graph.nodes),
            "total_dependencies": len(dependency_graph.edges),
            "most_dependent": max(dict(dependency_graph.in_degree()).items(), key=lambda x: x[1])[0],
            "most_dependencies": max(dict(dependency_graph.out_degree()).items(), key=lambda x: x[1])[0]
        }
        
        return {
            "dependencies": [
                {"from": u, "to": v} for u, v in dependency_graph.edges()
            ],
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error analyzing dependencies: {str(e)}")

def get_package_stats(package_name: str) -> Dict:
    """
    Get detailed statistics about a specific package.
    """
    try:
        data = get_pypi_data(package_name)
        if not data:
            raise HTTPException(status_code=404, detail=f"Package {package_name} not found")
        
        info = data["info"]
        releases = data["releases"]
        
        # Calculate release frequency
        release_dates = []
        for version_info in releases.values():
            if version_info:
                upload_time = version_info[0].get("upload_time")
                if upload_time:
                    release_dates.append(datetime.fromisoformat(upload_time.replace("Z", "+00:00")))
        
        release_dates.sort()
        if len(release_dates) > 1:
            avg_days_between_releases = (release_dates[-1] - release_dates[0]).days / (len(release_dates) - 1)
        else:
            avg_days_between_releases = None
        
        return {
            "name": package_name,
            "current_version": info["version"],
            "author": info["author"],
            "license": info["license"],
            "project_urls": info["project_urls"],
            "requires_python": info["requires_python"],
            "total_releases": len(releases),
            "first_release": release_dates[0].isoformat() if release_dates else None,
            "latest_release": release_dates[-1].isoformat() if release_dates else None,
            "avg_days_between_releases": avg_days_between_releases,
            "download_stats": {
                "last_month": info.get("downloads", {}).get("last_month", 0),
                "last_week": info.get("downloads", {}).get("last_week", 0),
                "last_day": info.get("downloads", {}).get("last_day", 0)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error getting package stats: {str(e)}")

def export_report(requirements_text: str, format: str, report_id: str) -> str:
    """
    Generate a comprehensive analysis report in various formats.
    """
    try:
        # Parse requirements and get all analysis data
        requirements = parse_requirements(requirements_text)["requirements"]
        compatibility_data = asyncio.run(check_compatibility(requirements_text))
        vulnerability_data = check_vulnerabilities(requirements_text)
        dependency_data = analyze_dependencies(requirements_text)
        
        if format.lower() == "pdf":
            return _generate_pdf_report(
                report_id,
                requirements,
                compatibility_data,
                vulnerability_data,
                dependency_data
            )
        elif format.lower() == "json":
            return _generate_json_report(
                report_id,
                requirements,
                compatibility_data,
                vulnerability_data,
                dependency_data
            )
        else:
            raise ValueError(f"Unsupported format: {format}")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating report: {str(e)}")

def _generate_pdf_report(
    report_id: str,
    requirements: List[Dict],
    compatibility_data: Dict,
    vulnerability_data: Dict,
    dependency_data: Dict
) -> str:
    """
    Generate a PDF report with all analysis data.
    """
    pdf = FPDF()
    pdf.add_page()
    
    # Title
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Requirements Analysis Report", ln=True, align="C")
    pdf.ln(10)
    
    # Requirements Summary
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Requirements Summary", ln=True)
    pdf.set_font("Arial", "", 12)
    for req in requirements:
        pdf.cell(0, 10, f"{req['name']}: {req['version']}", ln=True)
    pdf.ln(10)
    
    # Compatibility Summary
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Compatibility Summary", ln=True)
    pdf.set_font("Arial", "", 12)
    summary = compatibility_data["summary"]
    pdf.cell(0, 10, f"Up to date: {summary['up_to_date']}", ln=True)
    pdf.cell(0, 10, f"Needs update: {summary['needs_update']}", ln=True)
    pdf.ln(10)
    
    # Vulnerability Summary
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Vulnerability Summary", ln=True)
    pdf.set_font("Arial", "", 12)
    summary = vulnerability_data["summary"]
    pdf.cell(0, 10, f"Vulnerable packages: {summary['vulnerable_packages']}", ln=True)
    pdf.cell(0, 10, f"Total vulnerabilities: {summary['total_vulnerabilities']}", ln=True)
    
    # Save the report
    filename = f"reports/{report_id}.pdf"
    os.makedirs("reports", exist_ok=True)
    pdf.output(filename)
    
    return filename

def _generate_json_report(
    report_id: str,
    requirements: List[Dict],
    compatibility_data: Dict,
    vulnerability_data: Dict,
    dependency_data: Dict
) -> str:
    """
    Generate a JSON report with all analysis data.
    """
    report = {
        "report_id": report_id,
        "timestamp": datetime.now().isoformat(),
        "requirements": requirements,
        "compatibility": compatibility_data,
        "vulnerabilities": vulnerability_data,
        "dependencies": dependency_data
    }
    
    filename = f"reports/{report_id}.json"
    os.makedirs("reports", exist_ok=True)
    with open(filename, "w") as f:
        json.dump(report, f, indent=2)
    
    return filename 