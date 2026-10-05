// Css
import "./Content.css"

import Sidebar from "../Sidebar/Sidebar"

export default function Content({ children }) {

    return (
        <main className="container">
            {children}
            <Sidebar />
        </main>
    )

}