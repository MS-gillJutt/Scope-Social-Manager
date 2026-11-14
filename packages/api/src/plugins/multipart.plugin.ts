import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';

export default fp(async function multipartPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB max file size
      files: 10,                   // max 10 files per upload
      fieldNameSize: 100,
      fieldSize: 1024 * 1024,      // 1 MB for non-file fields
    },
    attachFieldsToBody: false,
  });
});
