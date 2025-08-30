import React, { useState } from 'react';

const ResultImages = () => {
  // Sample image data - replace with your actual image URLs
  const [images] = useState([
    {
      id: 1,
      url:"/result2.png",
      title: "Social Media",
      description: ""
    },
    {
      id: 2,
      url: "/result3.png",
      title: "Ocean View",
      description: ""
    },
    {
      id: 3,
      url: "/result4.png",
      title: "Forest Path",
      description: ""
    },
    {
      id: 4,
      url: "/result5.png",
      title: "Rocky Beach",
      description: ""
    },
    {
      id: 5,
      url: "/result6.png",
      title: "Flower Field",
      description: ""
    },
    {
      id: 6,
      url: "/result7.png",
      title: "Mountain Lake",
      description: ""
    },
    {
      id: 7,
      url: "/result8.png",
      title: "Flower Field",
      description: ""
    },
    {
      id: 8,
      url: "/result9.png",
      title: "Mountain Lake",
      description: ""
    }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold text-center text-white mb-4">
          Executives Selection
        </h1>
        <p className="text-center text-gray-300 mb-10">
          Congratulations to all
        </p>
        
        <div className="space-y-8 flex flex-col items-center">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="w-[90%] overflow-hidden rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="relative group">
                <img 
                  src={image.url} 
                  alt={image.title}
                  className="w-full h-auto object-cover max-h-[70vh]"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                  <div className="p-6 text-white transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <h3 className="text-xl font-semibold">{image.title}</h3>
                    <p className="text-gray-200">{image.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center text-gray-400">
          <p>~ Team Gfg</p>
        </div>
      </div>
    </div>
  );
};

export default ResultImages;