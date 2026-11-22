import { factories } from '@strapi/strapi';

import { publishedOnly } from '../../../utils/published-only';

export default factories.createCoreService('api::project.project', publishedOnly);
