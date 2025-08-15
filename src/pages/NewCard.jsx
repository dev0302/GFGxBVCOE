import React, { useState } from 'react';
import verify from "../assets/verify.svg";
import profile from "../assets/profile.svg";
import tick from "../assets/tick-circle.svg";
import activity from "../assets/activity.svg";
// import TimelineModal from './TimelineModal';

// I've added p0, p1, p2 to receive timeline data
function NewCard({ name, position, image, p0, p1, p2 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create a timeline array from the props.
  // The .filter(Boolean) removes any empty/null entries.
  const timeline = [p0, p1, p2].filter(Boolean);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // The 'person' object now holds all data for the modal
  const personData = {
    name,
    image,
    timeline,
  };

  return (
    <>
      <div className='mt-2 flex justify-center items-center font-poppins text-[#E6F4EA]'>
        <div className="rounded-[32px] w-[300px] h-[460px]
          bg-gradient-to-br from-[#1B5E3C] to-[#2E7D4F]
          shadow-xl ring-1 ring-[#4CAF50]/40 overflow-hidden transition hover:scale-[1.02] duration-300">

          <img
            src={image}
            alt={name}
            className='w-full h-[70%] object-cover rounded-[32px] p-1'
          />

          <div className='px-6 py-3'>
            <p className='text-lg font-semibold flex items-center gap-1 text-[#E6F4EA]'>
              {name}
              <span><img src={verify} className='h-4' alt="verified" /></span>
            </p>

            <p className='text-sm text-[#CDEED0] mt-1 leading-tight'>
              {position}
            </p>

            <div className='flex justify-between items-center mt-4 text-sm text-[#B8E4C2]'>
              <div className='flex gap-4 items-center'>
                <span className='flex items-center gap-1'>
                  <img src={profile} className='h-4 invert' alt="profile" />
                  312
                </span>
                <span className='flex items-center gap-1'>
                  <img src={tick} className='h-4 invert' alt="tick" />
                  48
                </span>
              </div>

              <button
                onClick={handleOpenModal}
                className='bg-[#4CAF50]/20 px-2 py-1 rounded-full border border-[#A3D9B4] text-xs font-medium hover:bg-[#4CAF50]/40 transition flex gap-1 text-[#E6F4EA]'
              >
                View Timeline <img src={activity} className='h-4 invert' alt="activity" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The modal now receives a single 'person' object with all necessary data */}
      {isModalOpen && <TimelineModal person={personData} onClose={handleCloseModal} />}
    </>
  );
}

export default NewCard;