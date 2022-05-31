import React, { useState, useEffect } from 'react'
import JitsiComponent from "./Jitsi.component.jsx";
import { useParams } from "react-router-dom";

function Meeting() {
  const [meeting, setMeeting] = useState({});
  const params = useParams();

  useEffect(() => {
    const id = params.id;
    setMeeting({
      id: id,
      title: id,
      description: '',
      startTime: new Date(),
    }, [id])
  }, [params]);

  return (
    <div>
     <JitsiComponent element={meeting}/> 
    </div>
  )
}

export default Meeting
