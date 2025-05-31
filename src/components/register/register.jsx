import React, { useState } from 'react';
import './register.css'; // Import the CSS file

const Register = () => {
    const [username, setUsername] = useState(''); // State for username
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', { // Adjust the endpoint as needed
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }), // Include username in the request
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Registration successful! Please log in.');
                setUsername(''); // Reset username field
                setEmail(''); // Reset email field
                setPassword(''); // Reset password field
                setError('');
            } else {
                setError(data.message || 'Registration failed. Please try again.');
                setSuccess('');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
            setSuccess('');
            console.error(err);
        }
    };

    return (
        <div className="register-container">
            <h2 className="register-title">Register</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <form className="register-form" onSubmit={handleRegister}>
                <div className="input-group">
                    <label htmlFor="username">Username</label> <br />
                    <input
                        type="text" // Corrected type for username
                        id="username"
                        value={username} // Use username state
                        onChange={(e) => setUsername(e.target.value)} // Update username state
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label> <br />
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label> <br />
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="register-button">Register</button>
            </form>
        </div>
    );
};

export default Register;
