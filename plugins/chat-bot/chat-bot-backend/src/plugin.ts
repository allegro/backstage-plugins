import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';

/**
 * chatBotPlugin backend plugin
 *
 * @public
 */
export const chatBotPlugin = createBackendPlugin({
  pluginId: 'chat-bot',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init({ httpRouter, logger, config, discovery, auth }) {
        httpRouter.use(
          await createRouter({
            logger,
            config,
            discovery,
            auth,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        if (config.get('auth.environment') === 'development') {
          httpRouter.addAuthPolicy({
            path: '/prompt',
            allow: 'unauthenticated',
          });

          httpRouter.addAuthPolicy({
            path: '/slack/event',
            allow: 'unauthenticated',
          });
        }
      },
    });
  },
});
