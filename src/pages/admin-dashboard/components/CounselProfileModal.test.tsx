import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CounselProfileModal from './CounselProfileModal'

const mockCounsel = {
  name: 'Dr. Thabo Mbeki',
  email: 'thabo.mbeki@counsel.co.za',
  phone: '+27 11 123 4567',
  expertise: 'Corporate Law & M&A',
  location: 'Johannesburg, Gauteng',
  experience: '15 years experience',
}

describe('CounselProfileModal', () => {
  it('renders phone number in an editable input', () => {
    render(
      <CounselProfileModal
        isOpen={true}
        onClose={vi.fn()}
        counsel={mockCounsel}
      />
    )

    const phoneInput = screen.getByLabelText('Phone Number') as HTMLInputElement
    expect(phoneInput).toBeInTheDocument()
    expect(phoneInput.disabled).toBe(false)
    expect(phoneInput.readOnly).toBe(false)
    expect(phoneInput.value).toBe('+27 11 123 4567')
  })

  it('allows updating phone number and calling onSave', () => {
    const handleSave = vi.fn()
    const handleClose = vi.fn()

    render(
      <CounselProfileModal
        isOpen={true}
        onClose={handleClose}
        counsel={mockCounsel}
        onSave={handleSave}
      />
    )

    const phoneInput = screen.getByLabelText('Phone Number')
    fireEvent.change(phoneInput, { target: { value: '+27 11 999 8888' } })

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)

    expect(handleSave).toHaveBeenCalledWith({
      ...mockCounsel,
      phone: '+27 11 999 8888',
    })
    expect(handleClose).toHaveBeenCalled()
  })
})
