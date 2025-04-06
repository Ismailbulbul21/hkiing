import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SurveyForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    education: 'high-school',
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Process form data - in a real application this would send data to a server
    console.log('Form submitted:', formData);
    // Show success message
    setSubmitted(true);
    // In a real app, this would redirect to a thank you page
  };

  if (submitted) {
    return (
      <div className="survey-success">
        <h1>Thank You for Your Participation!</h1>
        <p>Your knowledge about Somali history is valuable to our research.</p>
        <p>We'll send your personalized history resources to your email soon.</p>
        <Link to="/" className="cta-button">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="survey-container">
      <div className="survey-header">
        <h1>Somali History Knowledge Survey</h1>
        <p>
          Complete this survey to help us understand public knowledge about Somali history.
          Participants will receive free access to our digital library of historical resources.
        </p>
      </div>

      <form className="survey-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Account Creation</h2>
          <p className="section-description">
            Create an account to access your personalized history resources after completing the survey.
          </p>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
            <small>We'll send your resource access to this email</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Create Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Choose a secure password"
              required
            />
            <small>Used to access your personalized resources</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Personal Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              min="18"
              max="100"
              value={formData.age}
              onChange={handleChange}
              placeholder="Your age"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="education">Education Level</label>
            <select
              id="education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              required
            >
              <option value="high-school">High School</option>
              <option value="some-college">Some College</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="phd">PhD or Higher</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Somali History Questions</h2>
          
          <div className="form-group">
            <label htmlFor="q1">When did Somalia gain independence?</label>
            <select
              id="q1"
              name="q1"
              value={formData.q1}
              onChange={handleChange}
              required
            >
              <option value="">Select your answer</option>
              <option value="1950">1950</option>
              <option value="1960">1960</option>
              <option value="1970">1970</option>
              <option value="1980">1980</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="q2">Who was the first president of Somalia?</label>
            <select
              id="q2"
              name="q2"
              value={formData.q2}
              onChange={handleChange}
              required
            >
              <option value="">Select your answer</option>
              <option value="aden-abdullah">Aden Abdullah Osman Daar</option>
              <option value="siad-barre">Siad Barre</option>
              <option value="abdirashid-ali">Abdirashid Ali Shermarke</option>
              <option value="sheikh-hussein">Sheikh Mukhtar Mohamed Hussein</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="q3">What was the main language used in ancient Somali trade?</label>
            <select
              id="q3"
              name="q3"
              value={formData.q3}
              onChange={handleChange}
              required
            >
              <option value="">Select your answer</option>
              <option value="arabic">Arabic</option>
              <option value="somali">Somali</option>
              <option value="swahili">Swahili</option>
              <option value="persian">Persian</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="q4">Which ancient civilization had trade relations with the Somali coast?</label>
            <select
              id="q4"
              name="q4"
              value={formData.q4}
              onChange={handleChange}
              required
            >
              <option value="">Select your answer</option>
              <option value="egypt">Ancient Egypt</option>
              <option value="greece">Ancient Greece</option>
              <option value="rome">Ancient Rome</option>
              <option value="all">All of the above</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="q5">What is the significance of the 'Day of the Flag' in Somali history?</label>
            <textarea
              id="q5"
              name="q5"
              value={formData.q5}
              onChange={handleChange}
              placeholder="Share your knowledge about this important day..."
              required
            ></textarea>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="cta-button">Submit Survey & Create Account</button>
        </div>

        <div className="form-disclaimer">
          <p>
            By submitting this form, you agree to our Terms of Service and Privacy Policy.
            We will use your email to send you access to our historical resources and occasional updates.
          </p>
        </div>
      </form>
    </div>
  );
};

export default SurveyForm; 