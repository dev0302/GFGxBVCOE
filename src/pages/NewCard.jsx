import React, { useState } from 'react';
import verify from "../assets/verify.svg";
import activity from "../assets/activity.svg";
import TimelineModal from './TimelineModal';

const LinkedInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>;
const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664 4.771 4.919 4.919 1.266-.058 1.644.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>;


function NewCard({ person }) {
  const { name, position, image, timeline, instaLink, linkedinLink } = person;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className='flex justify-center items-center font-nunito text-white'>
        <div className="glowing-container">
          <div className="
            p-2
            group
            w-full h-full  /* Changed to w-full h-full to fit the container */
            flex flex-col
            rounded-3xl 
            overflow-hidden 
            bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] 
            backdrop-blur-sm 
            border border-gray-300/20 
            transition-all duration-300
            hover:scale-[1.03] 
            hover:shadow-xl hover:shadow-cyan-500/20
          ">
            
            <div className='w-full h-[70%] overflow-hidden rounded-t-3xl'>
              <img 
                src={image} 
                alt={name} 
                className='w-full h-full object-cover object-top rounded-3xl transition-transform duration-300 group-hover:scale-105 hover:rounded-3xl' 
              />
            </div>

            <div className='p-5 py-6 flex flex-col gap-1 flex-grow'>
              <div>
                <p className='text-lg font-bold font-montserrat flex items-center gap-1.5 text-white'>
                  {name}
                  <span><img src={verify} className='h-4' alt="verified" /></span>
                </p>
                <p className='text-sm text-gray-300 mt-1 leading-tight'>
                  {position}
                </p>
              </div>
              
              <div className='flex-grow py-2'></div>

              <div className='flex justify-between items-center text-sm'>
                <div className='flex gap-3 items-center text-cyan-400'>
                  {linkedinLink && (
                    <a href={linkedinLink} target="_blank" rel="noopener noreferrer" className="transition-all hover:text-white hover:[filter:drop-shadow(0_0_4px_theme(colors.cyan.400))]"><LinkedInIcon /></a>
                  )}
                  {instaLink && (
                    <a href={instaLink} target="_blank" rel="noopener noreferrer" className="transition-all hover:text-white hover:[filter:drop-shadow(0_0_4px_theme(colors.cyan.400))]"><InstagramIcon /></a>
                  )}
                </div>
                
                <button
                  onClick={() => setIsModalOpen(true)}
                  className='
                    flex items-center gap-1.5 
                    px-3 py-1.5
                    rounded-full 
                    text-xs font-semibold
                    bg-cyan-500/10
                    text-cyan-300
                    border border-cyan-400/30
                    transition-all duration-200
                    hover:bg-cyan-500/20
                    hover:border-cyan-400/50
                    hover:text-white
                  '
                >
                  View Timeline <img src={activity} className='h-4 invert' alt="activity" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && <TimelineModal person={person} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

export default NewCard;