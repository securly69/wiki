import { NextApiRequest } from 'next'
import { NextApiResponseServerIO, initializeSocketIO } from '@/lib/socket-server'

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    const io = initializeSocketIO(res.socket.server)
    res.socket.server.io = io
  }
  res.end()
}
