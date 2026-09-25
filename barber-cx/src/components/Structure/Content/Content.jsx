// Css
import Sidebar from "../Sidebar/Sidebar"
import "./Content.css"

export default function Content({ children }) {

    return (
        <main className="container">
            <Sidebar />
            <div className="content">{children}</div>
        </main>
    )

}