import { IconToolsKitchen2 } from '@tabler/icons-react'

function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-xl bg-card flex items-center justify-center mb-4">
        <IconToolsKitchen2 size={32} className="text-accent" />
      </div>
      <h1 className="text-xl font-medium text-primary mb-2">
        TuckRate
      </h1>
      <p className="text-sm text-secondary max-w-[280px]">
        Rate & review your hostel tuck shop food — real opinions from real students.
      </p>
    </div>
  )
}

export default HomePage
