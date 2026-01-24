import { Application } from '@hotwired/stimulus';

let application;

export function startApplication() {
  if (application) {
    return application;
  }

  application = Application.start();
  return application;
}

export function getApplication() {
  return application;
}

export { application };
