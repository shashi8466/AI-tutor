import React from 'react';
    import * as FiIcons from 'react-icons/fi';

    const SafeIcon = ({ icon, name, ...props }) => {
      let IconComponent;
      try {
        IconComponent = icon || (name && FiIcons[`Fi${name}`]);
      } catch (e) {
        console.error(`SafeIcon: Failed to find icon "${name}"`, e);
        IconComponent = null;
      }
      return IconComponent ? React.createElement(IconComponent, props) : <FiIcons.FiAlertTriangle {...props} />;
    };

    export default SafeIcon;