import { useRef } from "react";

const TeamSection = () => {
  const members = [
    {
      name: "Toshika Goswami",
      branch: "CSE",
      year: "4th",
      position: "Chair Person",
      p0: "Chair Person",
      image: "/Toshika.webp",
      p1: "social media lead",
      p2: "",
      email: "toshikagoswami4@gmail.com",
      instaLink: "nil",
      linkedinLink: "https://www.linkedin.com/in/toshika-goswami-39791022a"
    },
    {
      name: "Harsh Bhardwaj",
      branch: "CSE",
      year: "",
      position: "Marketing Lead",
      p0: "Marketing Lead",
      image: "/Harsh.webp",
      p1: "Marketing head",
      p2: "Marketing head",
      email: "itzharsh045@gmail.com",
      instaLink: "https://www.instagram.com/mystic_harsh_45?igsh=d2Q3ZWdqd3FhazNu",
      linkedinLink: "https://www.linkedin.com/in/harsh-bhardwaj-255357292"
    },
    {
      name: "Aarti Singh",
      branch: "CSE",
      year: "2nd",
      position: "Social media and promotion lead",
      p0: "social media and promotion lead",
      image: "/Aarti.webp",
      p1: "social media executive",
      p2: "",
      email: "37aartisingh121212@gmail.com",
      instaLink: "https://www.instagram.com/aartiii.60?utm_source=qr&igsh=bWsyajFvMjh2NWli",
      linkedinLink: "https://www.linkedin.com/in/aarti-singh-b7700b333"
    },
    {
      name: "Gaurav Karakoti",
      branch: "CSE",
      year: "2nd",
      position: "Event & Operations Head",
      p0: "Event & Operations Head",
      image: "/Gaurav.webp",
      p1: "Technical Executive",
      p2: "",
      email: "karakotigaurav12@gmail.com",
      instaLink: "https://instagram.com/gaurav._.karakoti",
      linkedinLink: "https://linkedin.com/in/gaurav-karakoti"
    },
    {
      name: "Kartik Bhattacharya",
      branch: "CSE",
      year: "3rd",
      position: "Vice-chairperson and technical lead",
      p0: "Vice-chairman and technical lead",
      image: "/Kartik.webp",
      p1: "Technical executive",
      p2: "",
      email: "kartikbhattacharya10@gmail.com",
      instaLink: "https://www.instagram.com/_kafiltafish_21_/",
      linkedinLink: "https://linkedin.com/in/kafiltafish21"
    },
    {
      name: "Archita",
      branch: "Information Technology",
      year: "3rd",
      position: "Design and Creative lead",
      p0: "Design and Creative lead",
      image: "/Archita.webp",
      p1: "Design + marketing executive",
      p2: "",
      email: "archita770@gmail.com",
      instaLink: "https://www.instagram.com/archiitta.r?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      linkedinLink: "https://www.linkedin.com/in/archita-337521376"
    },
    {
      name: "Piyush Kumar Singh",
      branch: "CSE",
      year: "2nd",
      position: "Public Relations & Outreach",
      p0: "Public Relations & Outreach",
      image: "/Piyush.webp",
      p1: "Executive Technical",
      p2: "",
      email: "piyushksbvp@gmail.com",
      instaLink: "https://www.instagram.com/thepiyushks/",
      linkedinLink: "https://in.linkedin.com/in/piyush-kumar-singh1"
    }
  ];

  return (
    <section className="relative py-20 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Meet the Core Team: Driving GFGxBVCOE Forward
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-green-100 mb-4 leading-relaxed">
              Our society is powered by a dedicated team of student leaders passionate about technology and community building.
            </p>
            <p className="text-xl text-green-100 leading-relaxed">
              Each member contributes unique skills and vision to our initiatives.
            </p>
          </div>
        </div>

        {/* Team Member Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {members.map((member, index) => (
            <div 
              key={index}
              className={`group relative overflow-hidden rounded-2xl aspect-[3/4] bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-400/20 hover:scale-105 transition-all duration-300 ${
                index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
                style={{
                  backgroundImage: `url(${member.image})`,
                }}
              ></div>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-green-800/50 to-transparent"></div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-4">
                {/* Avatar with Image */}
                <div className={`w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mb-3 overflow-hidden border-4 border-white/20 ${
                  index === 0 ? 'w-28 h-28' : ''
                }`}>
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                
                {/* Member Info */}
                <h3 className={`font-bold mb-1 text-white ${index === 0 ? 'text-xl' : 'text-lg'}`}>
                  {member.name}
                </h3>
                <p className="text-green-200 text-xs mb-1">
                  {member.position}
                </p>
                <p className="text-green-100 text-xs mb-3">
                  {member.branch} • {member.year} Year
                </p>
                
                {/* Social Links */}
                <div className="flex gap-2">
                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`}
                      className="w-7 h-7 bg-green-500/80 rounded-full flex items-center justify-center hover:bg-green-400 transition-colors duration-200"
                      title="Email"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </a>
                  )}
                  
                  {member.linkedinLink && member.linkedinLink !== "nil" && (
                    <a 
                      href={member.linkedinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-blue-600/80 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors duration-200"
                      title="LinkedIn"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </a>
                  )}
                  
                  {member.instaLink && member.instaLink !== "nil" && (
                    <a 
                      href={member.instaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-pink-600/80 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors duration-200"
                      title="Instagram"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-xl text-green-100 max-w-4xl mx-auto leading-relaxed">
            Get to know the faces behind GFGxBVCOE who work tirelessly to bring you the best learning experiences.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
