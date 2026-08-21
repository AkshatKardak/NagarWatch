'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Socket, io } from 'socket.io-client'

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
      'http://localhost:3001'

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  return context
}

export default SocketProvider
