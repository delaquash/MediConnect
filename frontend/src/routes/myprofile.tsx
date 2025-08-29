import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/myprofile')({
  component: MyProfile,
})

function MyProfile() {
  return (
    <div>Hello "/doctors/myprofile"!</div>
  )
}
