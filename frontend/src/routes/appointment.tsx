import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/appointment')({
  component: Appointment,
})

function Appointment() {
  return <div>Hello "/appointment"!</div>
}
