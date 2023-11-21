import * as winston from 'winston'
import { Logtail } from '@logtail/node'
import { env } from '../env'
import { LogtailTransport } from '@logtail/winston'
// by default all logs in local dev or if the env var DEBUG=true is set, otherwise we'll exclude debug logs

const logLevel = process.env.DEBUG_LOG === 'true' ? 'debug' : 'info'
let logtail: Logtail | undefined
if(env.LOGTAIL_KEY){
  logtail = new Logtail(env.LOGTAIL_KEY)
}

export const createLogger = (remoteAppName: string, label?: string) => {
  return winston.createLogger({
    level: logLevel,
    exitOnError: false,
    transports: getTransports(getFormat(label), remoteAppName),
    handleExceptions: true,
  })
}

const log = winston.createLogger({
  level: logLevel,
  exitOnError: false,
  transports: [...getTransports(getFormat(), 'nft-monitor')],
  handleExceptions: true,
})
export default log

// logger for use as a middleware in express

function getFormat(label?: string) {
  const formats = []
  if (process.env.NODE_ENV !== 'production') {
    formats.push(winston.format.colorize())
  }
  if (label) {
    formats.push(winston.format.label({ label: label, message: true }))
  }
  return winston.format.combine(...formats, winston.format.simple())
}
function getTransports(format?: winston.Logform.Format, remoteAppName?: string) {
  const baseTransports = [new winston.transports.Console({ format: format })]
  // ship to logDNA.com if env var is set
  if (logtail && remoteAppName && process.env.NODE_ENV == 'production') {
    baseTransports.push(
      new LogtailTransport(logtail, {
        level: logLevel,
        format: getFormat(remoteAppName),
        handleExceptions: true,
      }) as any
    )
  }
  return baseTransports
}