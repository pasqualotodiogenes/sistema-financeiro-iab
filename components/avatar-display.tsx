import Image from "next/image"

type UserWithAvatar = {
  id: string
  username: string
  name?: string
  role: 'root' | 'admin' | 'editor' | 'viewer'
  password?: string
  createdAt?: string
  updatedAt?: string
  avatarUrl?: string | null
}

interface AvatarDisplayProps {
  user: UserWithAvatar | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function AvatarDisplay({ user, size = "md", className = "" }: AvatarDisplayProps) {
  if (!user) {
    return (
      <div className={`rounded-full bg-gray-300 flex items-center justify-center ${getSizeClasses(size)} ${className}`}>
        <Image src="/placeholder-user.jpg" alt="Usuário" className="w-full h-full object-cover" width={80} height={80} />
      </div>
    )
  }

  if (user.avatarUrl && typeof user.avatarUrl === 'string') {
    // Converte path para usar a nova API route se necessário
    const avatarSrc = user.avatarUrl.startsWith('/avatars/') 
      ? `/api/assets${user.avatarUrl}` 
      : user.avatarUrl;
    
    return (
      <div className={`rounded-full overflow-hidden ${getSizeClasses(size)} ${className}`}>
        <Image src={avatarSrc} alt={user.name || "Usuário"} className="w-full h-full object-cover" width={80} height={80} />
      </div>
    )
  }

  // Sempre exibe imagem padrão se não houver upload
  return (
    <div className={`rounded-full overflow-hidden ${getSizeClasses(size)} ${className}`}>
      <Image src="/placeholder-user.jpg" alt={user.name || "Usuário"} className="w-full h-full object-cover" width={80} height={80} />
    </div>
  )
}

function getSizeClasses(size: string): string {
  switch (size) {
    case "sm":
      return "w-8 h-8"
    case "md":
      return "w-10 h-10"
    case "lg":
      return "w-16 h-16"
    case "xl":
      return "w-20 h-20"
    default:
      return "w-10 h-10"
  }
}
