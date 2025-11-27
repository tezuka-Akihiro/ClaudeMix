// {{COMPONENT_NAME}} - {{COMPONENT_TYPE}} (components層)
// {{COMPONENT_DESCRIPTION}}

import React from 'react';
{{IMPORTS}}

interface {{COMPONENT_NAME}}Props {
  {{PROPS_DEFINITION}}
}

const {{COMPONENT_NAME}}: React.FC<{{COMPONENT_NAME}}Props> = ({
  {{PROPS_DESTRUCTURING}}
}) => {
  {{STATE_DEFINITIONS}}

  {{EVENT_HANDLERS}}

  {{USE_EFFECTS}}

  {{RENDER_CONDITIONS}}

  return (
    <div
      {{ELEMENT_ATTRIBUTES}}
      style={{
        {{ELEMENT_STYLES}}
      }}
    >
      {{COMPONENT_CONTENT}}
    </div>
  );
};

export default {{COMPONENT_NAME}};