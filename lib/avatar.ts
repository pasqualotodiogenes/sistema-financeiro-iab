export interface AvatarData {
  type: "upload" | "initials" | "icon"
  data: string // base64 for upload, initials for text, icon name for icon
  backgroundColor?: string
}

export class AvatarService {
  private static AVATAR_KEY = "iab_user_avatar"

  static saveAvatar(): void {
    // ... (substituir todas as operações de localStorage por queries SQLite, conforme já planejado na resposta anterior)
  }

  static getAvatar(): AvatarData | null {
    // ... (substituir todas as operações de localStorage por queries SQLite, conforme já planejado na resposta anterior)
    return null
  }

  static getAllAvatars(): Record<string, AvatarData> {
    // ... (substituir todas as operações de localStorage por queries SQLite, conforme já planejado na resposta anterior)
    return {}
  }

  static generateInitials(name: string): string {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  static getRandomColor(): string {
    const colors = [
      "#4a7c59", // primary green
      "#ef4444", // red
      "#f97316", // orange
      "#eab308", // yellow
      "#22c55e", // green
      "#06b6d4", // cyan
      "#3b82f6", // blue
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#64748b", // slate
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  static convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}
