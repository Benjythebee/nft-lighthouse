import { Prisma, PrismaClient } from "@prisma/client";
import { createLogger } from "../logger";
const log = createLogger('staging-auth', 'prisma')

const prisma = new PrismaClient();

// @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging
//@ts-ignore
prisma.$on('query', (e:any) => {
    log.info("Query: " + e.query + ' - ' + e.duration + 'ms')
  })

export default prisma;