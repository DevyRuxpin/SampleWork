import ReactGA from 'react-ga4';

export const useAnalytics = () => {
  const trackEvent = (action, category, label = null, value = null) => {
    ReactGA.event({
      category: category,
      action: action,
      label: label,
      value: value
    });
  };

  const trackUserAction = (action, details = {}) => {
    ReactGA.event({
      category: 'User Action',
      action: action,
      label: JSON.stringify(details)
    });
  };

  const trackFeatureUsage = (feature, details = {}) => {
    ReactGA.event({
      category: 'Feature Usage',
      action: feature,
      label: JSON.stringify(details)
    });
  };

  const trackError = (error, context = {}) => {
    ReactGA.event({
      category: 'Error',
      action: 'Error Occurred',
      label: `${error}: ${JSON.stringify(context)}`
    });
  };

  return {
    trackEvent,
    trackUserAction,
    trackFeatureUsage,
    trackError
  };
}; 