import type { ComponentType } from 'react';

// Contract between a feature and the app shell: each feature exports one `view` from its `index.ts`, and the shell
// registers it in `app/views.ts`.
export interface ViewDefinition {
  // Kebab-case and unique across views; the view's URL is `#/<id>`.
  id: string;
  // Text of the view's link in the navigation menu.
  label: string;
  // First part of the document title: `<title> · Witness`.
  title: string;
  // The view itself; it takes no props.
  Component: ComponentType;
}
