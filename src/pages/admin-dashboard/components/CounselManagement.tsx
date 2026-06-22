import { Mail, MapPin, Phone, Plus, Search } from 'lucide-react'

const counselIconAssets = {
  scale: 'http://localhost:3845/assets/d8431c19281ee249950d588f7e06b5a2596055c7.svg',
  clock: 'http://localhost:3845/assets/2c59fa8f41eb4b11d72af7dbb2fad5262b68b76e.svg',
  completed: 'http://localhost:3845/assets/b78d8a9c3fdf67664434591876ab04caeb1258f8.svg',
  trend: 'http://localhost:3845/assets/51c9a700e9c33e09894dbacd7c24943eec4e6024.svg',
  monthCheck: 'http://localhost:3845/assets/58bc07ec7cffebb234a208ca8614cf0d674151c1.svg',
  dropdown: 'http://localhost:3845/assets/8e02c2a9e2a915b2810831f4c9899ba7dced19b8.svg',
}

const adminCounselMembers = [
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

export default function CounselManagement() {
  return (
    <section className="admin-counsel">
      <div className="admin-counsel__stats" aria-label="Counsel summary">
        <article className="admin-counsel__stat">
          <span>
            <img src={counselIconAssets.scale} alt="" aria-hidden="true" />
          </span>
          <div>
            <strong>6</strong>
            <p>Total Counsel</p>
            <small>
              <b>4 Available</b>
              <i>·</i>
              <em>2 Not Available</em>
            </small>
          </div>
        </article>
        <article className="admin-counsel__stat">
          <span>
            <img src={counselIconAssets.clock} alt="" aria-hidden="true" />
          </span>
          <div>
            <strong>61</strong>
            <p>Active Cases</p>
            <small>
              <img src={counselIconAssets.trend} alt="" aria-hidden="true" />
              <b>18% increase</b>
            </small>
          </div>
        </article>
        <article className="admin-counsel__stat">
          <span>
            <img src={counselIconAssets.completed} alt="" aria-hidden="true" />
          </span>
          <div>
            <strong>1,618</strong>
            <p>Completed Cases</p>
            <small>
              <img src={counselIconAssets.monthCheck} alt="" aria-hidden="true" />
              <b>This month: 68</b>
            </small>
          </div>
        </article>
      </div>

      <div className="admin-counsel__filters">
        <label className="admin-counsel__search">
          <Search size={16} />
          <input type="search" placeholder="Search counsel..." />
        </label>
        <button type="button" className="admin-counsel__filter-button">
          All Expertise
          <img src={counselIconAssets.dropdown} alt="" aria-hidden="true" />
        </button>
        <button type="button" className="admin-counsel__filter-button">
          All Status
          <img src={counselIconAssets.dropdown} alt="" aria-hidden="true" />
        </button>
        <button type="button" className="admin-counsel__add">
          <Plus size={20} />
          Add Counsel
        </button>
      </div>

      <div className="admin-counsel__grid">
        {adminCounselMembers.map((member) => (
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
                <li>{member.experience}</li>
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

              <div className="admin-counsel__card-metric">
                <strong>{member.completed}</strong>
                <span>Completed</span>
              </div>

              <button type="button">View Profile</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// Made with Bob
