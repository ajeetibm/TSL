import './HowItWorks.css'

const processSteps = [
  ['1', 'Add to Cart', 'Multiple times if needed'],
  ['2', 'View Details', "See what's included"],
  ['3', 'Sign Up', 'Only when ready'],
  ['4', 'Complete Wizards', 'Get your docs'],
]

export function HowItWorks() {
  return (
    <section className="how-it-works">
      <h3>How This Works</h3>
      <p>
        Add wizards to your cart. You can add the same wizard multiple times if you need multiple documents of the same
        type.
      </p>

      <div className="how-it-works__steps">
        {processSteps.map(([number, title, detail]) => (
          <div key={number} className="how-it-works__step">
            <span>{number}</span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
