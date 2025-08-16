import React, { useState } from 'react';
import verify from "../assets/verify.svg";
import activity from "../assets/activity.svg";
import TimelineModal from './TimelineModal';

// Icons for social links (simple SVGs)
const LinkedInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>;
const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>;


function NewCard({ person }) {
  const { name, position, image, timeline, instaLink, linkedinLink } = person;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className='flex justify-center items-center font-poppins text-[#E6F4EA]'>
        <div className="rounded-[32px] w-[280px] h-[420px] flex flex-col
          bg-[#323E4]
          shadow-xl ring-1 border-2 border-gray-400 border-opacity-50 overflow-hidden transition hover:scale-[1.02] duration-300">

          <img src={image} alt={name} className='w-full h-[70%] object-cover object-top rounded-[32px] p-1' />

          <div className='p-6 flex flex-col flex-grow'>
            <div>
              <p className='text-lg font-semibold flex items-center gap-1 text-gray-200'>
                {name}
                <span><img src={verify} className='h-4' alt="verified" /></span>
              </p>
              <p className='text-sm text-richblack-200 mt-1 leading-tight'>
                {position}
              </p>
            </div>
            
            <div className='flex-grow'></div> {/* Spacer */}

            <div className='flex justify-between items-center text-sm'>
              <div className='flex gap-2 items-center text-[#B8E4C2]'>
                {linkedinLink && (
                  <a href={linkedinLink} target="_blank" rel="noopener noreferrer" className="transition hover:text-white"><LinkedInIcon /></a>
                )}
                {instaLink && (
                  <a href={instaLink} target="_blank" rel="noopener noreferrer" className="transition hover:text-white"><InstagramIcon /></a>
                )}
              </div>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-[#4CAF50]/20 px-2 py-1 rounded-full border border-[#A3D9B4] text-xs font-medium hover:bg-[#4CAF50]/40 transition flex gap-1 items-center text-[#E6F4EA]'
              >
                View Timeline <img src={activity} className='h-4 invert' alt="activity" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && <TimelineModal person={person} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

export default NewCard;