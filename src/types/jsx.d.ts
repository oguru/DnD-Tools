declare module '*.jsx' {
  import type { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

