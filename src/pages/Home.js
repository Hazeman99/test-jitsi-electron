import { useNavigate } from 'react-router-dom'

function Home() {
    let navigate = useNavigate();

    function getRandomID() {
        return Math.floor(Math.random() * 1000000)
    }


    return (
        <div>
            <h1>Home</h1>

            <button onClick={() => {
                navigate("/" + getRandomID())
            }}>Start a meeting</button>
        </div>
    )
}

export default Home;
