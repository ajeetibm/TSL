import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Activity,
  Award,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Scale,
  Search,
} from 'lucide-react'
import AddCounselModal from './AddCounselModal'
import CounselProfileModal from './CounselProfileModal'
import { adminApi } from '../../../services/tslApi'

export type CounselMember = {
  initials: string
  name: string
  expertise: string
  status: string
  experience: string
  location: string
  email: string
  phone: string
  completed: number
}

const initialCounselMembers: CounselMember[] = [
  {
    initials: 'DTM',
    name: 'Dr. Thabo Mbeki',
    expertise: 'Corporate Law & M&A',
    status: 'Available',
    experience: '15 years experience',
    location: 'Johannesburg, Gauteng',
    email: 'thabo.mbeki@counsel.co.za',
    phone: '+27 11 123 4567',
    completed: 287,
  },
  {
    initials: 'AZK',
    name: 'Adv. Zanele Khumalo',
    expertise: 'Employment & Labour Law',
    status: 'Available',
    experience: '12 years experience',
    location: 'Cape Town, Western Cape',
    email: 'zanele.khumalo@counsel.co.za',
    phone: '+27 21 987 6543',
    completed: 234,
  },
  {
    initials: 'RM',
    name: 'Robert van der Merwe',
    expertise: 'Intellectual Property & Technology',
    status: 'Not Available',
    experience: '18 years experience',
    location: 'Pretoria, Gauteng',
    email: 'robert.vdm@counsel.co.za',
    phone: '+27 12 345 6789',
    completed: 342,
  },
  {
    initials: 'JN',
    name: 'Jennifer Naidoo',
    expertise: 'Commercial & Contract Law',
    status: 'Available',
    experience: '10 years experience',
    location: 'Durban, KwaZulu-Natal',
    email: 'jennifer.naidoo@counsel.co.za',
    phone: '+27 31 234 5678',
    completed: 198,
  },
  {
    initials: 'MB',
    name: 'Michael Botha',
    expertise: 'Regulatory & Compliance',
    status: 'Available',
    experience: '14 years experience',
    location: 'Johannesburg, Gauteng',
    email: 'michael.botha@counsel.co.za',
    phone: '+27 11 876 5432',
    completed: 256,
  },
  {
    initials: 'DLD',
    name: 'Dr. Lindiwe Dlamini',
    expertise: 'Company Law & Governance',
    status: 'Not Available',
    experience: '16 years experience',
    location: 'Sandton, Gauteng',
    email: 'lindiwe.dlamini@counsel.co.za',
    phone: '+27 11 234 9876',
    completed: 301,
  },
]

export { initialCounselMembers }

interface CounselManagementProps {
  counselMembers: CounselMember[]
  onCounselAdded: (counsel: CounselMember) => void
}

export default function CounselManagement({ counselMembers, onCounselAdded }: CounselManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedCounsel, setSelectedCounsel] = useState<CounselMember | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExpertise, setSelectedExpertise] = useState('All Expertise')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  
  // Dropdown open states
  const [isExpertiseDropdownOpen, setIsExpertiseDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  
  // Refs for dropdown click outside detection
  const expertiseDropdownRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expertiseDropdownRef.current && !expertiseDropdownRef.current.contains(event.target as Node)) {
        setIsExpertiseDropdownOpen(false)
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleViewProfile = (member: CounselMember) => {
    setSelectedCounsel(member)
    setIsProfileModalOpen(true)
  }

  const handleAddCounsel = async (newCounsel: CounselMember) => {
    await adminApi.addCounsel({
      fullName: newCounsel.name,
      email: newCounsel.email,
      phone: newCounsel.phone,
      expertise: newCounsel.expertise,
      location: newCounsel.location,
      experience: newCounsel.experience,
    })

    onCounselAdded(newCounsel)
    setIsAddModalOpen(false)
  }

  // Filter counsel members based on search and filters
  const filteredCounselMembers = useMemo(() => {
    return counselMembers.filter((member) => {
      // Search filter
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.expertise.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Expertise filter
      const matchesExpertise = selectedExpertise === 'All Expertise' || member.expertise === selectedExpertise
      
      // Status filter
      const matchesStatus = selectedStatus === 'All Status' || member.status === selectedStatus
      
      return matchesSearch && matchesExpertise && matchesStatus
    })
  }, [counselMembers, searchQuery, selectedExpertise, selectedStatus])

  // Get unique expertise areas for filter dropdown
  const uniqueExpertise = Array.from(new Set(counselMembers.map(member => member.expertise)))
  
  // Get unique statuses for filter dropdown
  const uniqueStatuses = Array.from(new Set(counselMembers.map(member => member.status)))

  const availableCount = counselMembers.filter((m) => m.status === 'Available').length
  const notAvailableCount = counselMembers.filter((m) => m.status === 'Not Available').length
  // const totalCompleted = counselMembers.reduce((sum, m) => sum + m.completed, 0)

  return (
    <>
      <AddCounselModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCounsel}
      />
      <CounselProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false)
          setSelectedCounsel(null)
        }}
        counsel={selectedCounsel}
      />
    <section className="admin-counsel">
      <div className="admin-counsel__stats" aria-label="Counsel summary">
        <article className="admin-counsel__stat">
          <span>
            <Scale size={28} />
          </span>
          <div>
            <strong>{counselMembers.length}</strong>
            <p>Total Counsel</p>
            <small>
              <b>{availableCount} Available</b>
              <i>·</i>
              <em>{notAvailableCount} Not Available</em>
            </small>
          </div>
        </article>
        <article className="admin-counsel__stat">
          <span>
            <Clock size={28} />
          </span>
          <div>
            <strong>61</strong>
            <p>Active Cases</p>
            <small>
              <Activity size={16} />
              <b>18% increase</b>
            </small>
          </div>
        </article>
        <article className="admin-counsel__stat">
          <span>
            <CheckCircle size={28} />
          </span>
          <div>
            <strong>1,618</strong>
            <p>Completed Cases</p>
            <small>
              <Check size={16} />
              <b>This month: 68</b>
            </small>
          </div>
        </article>
      </div>

      <div className="admin-counsel__filters">
        <label className="admin-counsel__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search counsel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
        
        {/* All Expertise Dropdown */}
        <div ref={expertiseDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="admin-counsel__filter-button"
            onClick={() => setIsExpertiseDropdownOpen(!isExpertiseDropdownOpen)}
          >
            {selectedExpertise}
            <ChevronDown size={16} />
          </button>
          {isExpertiseDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: '#ffffff',
              border: '2px solid #e5e5e5',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              overflow: 'hidden',
              width: 'max-content',
              minWidth: '100%',
            }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedExpertise('All Expertise')
                  setIsExpertiseDropdownOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: selectedExpertise === 'All Expertise' ? '#f5f5f5' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                All Expertise
              </button>
              {uniqueExpertise.map(expertise => (
                <button
                  key={expertise}
                  type="button"
                  onClick={() => {
                    setSelectedExpertise(expertise)
                    setIsExpertiseDropdownOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: selectedExpertise === expertise ? '#f5f5f5' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {expertise}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* All Status Dropdown */}
        <div ref={statusDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="admin-counsel__filter-button"
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            {selectedStatus}
            <ChevronDown size={16} />
          </button>
          {isStatusDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#ffffff',
              border: '2px solid #e5e5e5',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('All Status')
                  setIsStatusDropdownOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: selectedStatus === 'All Status' ? '#f5f5f5' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                All Status
              </button>
              {uniqueStatuses.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(status)
                    setIsStatusDropdownOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: selectedStatus === status ? '#f5f5f5' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button type="button" className="admin-counsel__add" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={20} />
          Add Counsel
        </button>
      </div>

      <div className="admin-counsel__grid">
        {filteredCounselMembers.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            No counsel members found matching your filters
          </div>
        ) : (
          filteredCounselMembers.map((member) => (
            <article className="admin-counsel__card" key={member.email}>
            <div className="admin-counsel__card-header">
              <div className="admin-counsel__card-top">
                <span>{member.initials}</span>
                <b
                  className={
                    member.status === 'Available'
                      ? 'admin-counsel__status admin-counsel__status--available'
                      : 'admin-counsel__status admin-counsel__status--unavailable'
                  }
                >
                  {member.status}
                </b>
              </div>
              <h2>{member.name}</h2>
              <p>{member.expertise}</p>
            </div>

            <div className="admin-counsel__card-body">
              <ul>
                <li>
                  <Award size={14} />
                  {member.experience}
                </li>
                <li>
                  <MapPin size={14} />
                  {member.location}
                </li>
              </ul>

              <div className="admin-counsel__card-contact">
                <div>
                  <Mail size={14} />
                  <span>{member.email}</span>
                </div>
                <div>
                  <Phone size={14} />
                  <span>{member.phone}</span>
                </div>
              </div>

              <div className="admin-counsel__completed">
                <strong>{member.completed}</strong>
                <span>Completed</span>
              </div>

              <button type="button" onClick={() => handleViewProfile(member)}>
                View Profile
              </button>
            </div>
            </article>
          ))
        )}
      </div>
    </section>
    </>
  )
}

// Made with Bob
