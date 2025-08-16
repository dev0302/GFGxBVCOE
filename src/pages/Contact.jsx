import React, { useRef, useState, useEffect } from 'react';
import gsap from 'https://esm.sh/gsap';
import { ScrollTrigger } from 'https://esm.sh/gsap/ScrollTrigger';
import emailjs from 'https://esm.sh/emailjs-com';
import Lenis from "lenis";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);


const contact = () => {

    useEffect(() => {
      const lenis = new Lenis({
        // duration:8,
        lerp: 0.1,
        smoothWheel: true,
      });
  
      // Sync Lenis scroll with ScrollTrigger
      lenis.on("scroll", ScrollTrigger.update);
  
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
  
    
    
  
      return () => {
        lenis.destroy(); // cleanup on unmount
      };
    });


    // Refs for elements
    const containerRef = useRef();
    const formRef = useRef();
    const infoRef = useRef();

    // State for form inputs
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    // State for submission status
    const [status, setStatus] = useState(''); // e.g., 'sending', 'sent', 'error'

    // GSAP animations using useEffect
    useEffect(() => {
        const ctx = gsap.context(() => {
            const elementsToAnimate = [formRef.current, infoRef.current].filter(Boolean);

            gsap.set(elementsToAnimate, { opacity: 0, y: 50 });

            elementsToAnimate.forEach(el => {
                if (!el) return;
                gsap.fromTo(el,
                    { opacity: 0, y: 60, scale: 0.95 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 1.2,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: el,
                            start: "top 85%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('sending');

        const serviceID = 'YOUR_SERVICE_ID';
        const templateID = 'YOUR_TEMPLATE_ID';
        const userID = 'YOUR_USER_ID';

        emailjs.send(serviceID, templateID, formData, userID)
            .then((response) => {
                console.log('SUCCESS!', response.status, response.text);
                setStatus('sent');
                setFormData({ name: '', email: '', message: '' });
            }, (err) => {
                console.log('FAILED...', err);
                setStatus('error');
            });
    };

    return (
        <div ref={containerRef} className="min-h-screen darkthemebg overflow-hidden text-white font-nunito py-20 px-4 sm:px-6 lg:px-8">
            <div className="fixed inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto mt-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-audiowide tracking-tight">
                         Get In <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">Touch</span>
                    </h1>
                    <p className="text-lg md:text-xl text-richblack-100 max-w-2xl mx-auto leading-relaxed">
                        Have a question or want to collaborate? Drop us a message!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
                    {/* Contact Form (takes 3/5 width) */}
                    <div ref={formRef} className="md:col-span-3 darkthemebg2 backdrop-blur-xl border-2 border-gray-300 border-opacity-20 rounded-3xl p-8">
                        <h2 className="text-3xl font-bold mb-6 text-transparent text-richblack-5">Send a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-richblack-25 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-400 bg-opacity-10 rounded-lg px-4 py-3 text-white placeholder-richblack-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300"
                                    placeholder="naam mei kya rkha hai"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-richblack-25 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-400 bg-opacity-10 rounded-lg px-4 py-3 text-white placeholder-richblack-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-richblack-25 mb-2">Message</label>
                                <textarea
                                    name="message"
                                    id="message"
                                    rows="5"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-400 bg-opacity-10 rounded-lg px-4 py-3 text-white placeholder-richblack-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300"
                                    placeholder="Your message here..."
                                ></textarea>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={status === 'sending'}
                                    className="w-full px-8 py-4   bg-cyan-700 text-white font-semibold hover:from-richblack-100 hover:to-richblack-25  text-lg rounded-full border border-green-300/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {status === 'sending' ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                        {status === 'sent' && <p className="text-green-300 mt-4 text-center">Message sent successfully! We'll get back to you soon.</p>}
                        {status === 'error' && <p className="text-red-400 mt-4 text-center">Something went wrong. Please try again later.</p>}
                    </div>

                    {/* Contact Info (takes 2/5 width) */}
                    <div ref={infoRef} className="md:col-span-2 flex flex-col justify-center">
                        <div className="darkthemebg2 backdrop-blur-xl border-2 border-gray-300 border-opacity-20  rounded-3xl p-8 h-full flex flex-col justify-center">
                            <img 
                                src="./bvcoebuilding.webp" 
                                alt="BVCOE College Building" 
                                className="w-full h-48 object-cover rounded-2xl mb-8 shadow-lg"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/1a2e2a/ffffff?text=Image+Not+Found'; }}
                            />
                            <div className="space-y-6">
                                <a href="https://www.google.com/maps/search/?api=1&query=BVCOE+New+Delhi" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 group">
                                    <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-richblack-25 group-hover:text-gray-50 transition-colors duration-300">Our Location</h3>
                                        <p className="text-richblack-200">BVCOE, New Delhi, India</p>
                                    </div>
                                </a>
                                <a href="mailto:geeksforgeeksbvp@gmail.com" className="flex items-center space-x-4 group">
                                    <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300">Email Us</h3>
                                        <p className="text-blue-200">geeksforgeeksbvp@gmail.com</p>
                                    </div>
                                </a>
                            </div>
                            <div className="border-t border-gray-600 mt-6 pt-6 flex justify-center space-x-6">
                                <a href="https://www.instagram.com/gfg_bvcoe?utm_source=qr&igsh=MWZzdTB2dWl5dmt6dQ==" target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:scale-125">
                                    <img src="https://cdn.simpleicons.org/instagram/a7f3d0" alt="Instagram" className="w-8 h-8 filter hover:brightness-0 hover:invert transition-all duration-300" />
                                    <span className="sr-only">Instagram</span>
                                </a>
                                <a href="https://www.linkedin.com/company/geeksforgeeks-campus-body-bvcoe/" target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:scale-125">
                                    <img src="https://img.icons8.com/?size=100&id=Zmq8UwmfMf8B&format=png&color=a7f3d0" alt="LinkedIn" className="w-8 h-8 filter hover:brightness-0 hover:invert transition-all duration-300" />
                                    <span className="sr-only">LinkedIn</span>
                                </a>
                                <a href="https://discord.gg/6X7Gc7Np" target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:scale-125">
                                    <img src="https://cdn.simpleicons.org/discord/a7f3d0" alt="Discord" className="w-8 h-8 filter hover:brightness-0 hover:invert transition-all duration-300" />
                                    <span className="sr-only">Discord</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default contact;
