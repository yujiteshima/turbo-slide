import { Application } from '@hotwired/stimulus';

// Import controllers
import SlideController from './slide_controller.js';
import TimerController from './timer_controller.js';
import ProgressController from './progress_controller.js';
import NavigationController from './navigation_controller.js';
import FullscreenController from './fullscreen_controller.js';
import PresenterController from './presenter_controller.js';
import ViewerController from './viewer_controller.js';

// Start Stimulus application
const application = Application.start();

// Register controllers
application.register('slide', SlideController);
application.register('timer', TimerController);
application.register('progress', ProgressController);
application.register('navigation', NavigationController);
application.register('fullscreen', FullscreenController);
application.register('presenter', PresenterController);
application.register('viewer', ViewerController);

export { application };
