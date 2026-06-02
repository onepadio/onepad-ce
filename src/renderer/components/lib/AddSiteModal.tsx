import { Plus } from "react-bootstrap-icons"
import Button from "./Button"
import Input from "./Input"
import Modal from "./Modal"

function AddSiteModal({
  show,
  onClose
}: any) {
  function parseForm(form) {
    const data = new FormData(form)
    return Object.fromEntries(data.entries())
  }

  const handleSubmit= (e) => {
    e.preventDefault()
    //const site = parseForm(e.currentTarget)
    //addSite(site, currentCategory)
    onClose()
    e.currentTarget.reset()
  }

  return (
        <Modal heading="Add Shortcut" show={show} onClose={onClose}>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <Input name="site" label="Name" placeholder="Google" required />
                <Input
          name="url"
          label="URL"
          placeholder="https://google.com"
          required
        />
                <Button className="w-full gap-2">
                    <Plus /> Add
        </Button>
      </form>
    </Modal>
  )
}

export default AddSiteModal
