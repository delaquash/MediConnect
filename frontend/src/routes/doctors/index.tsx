import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/doctors/')({
  component: Doctors,
})

function Doctors() {
  return <div>Hello "/doctors/"!</div>
}
