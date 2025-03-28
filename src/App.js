import React, { useState, useEffect } from "react";
import "./App.css"; // Import the CSS file

// Initial links (used if localStorage is empty)
const defaultLinks = [
  { id: 1, url: "https://jsonplaceholder.typicode.com/posts/1", status: "pending" },
  { id: 2, url: "https://jsonplaceholder.typicode.com/posts/2", status: "pending" },
  { id: 3, url: "https://jsonplaceholder.typicode.com/posts/3", status: "pending" },
  { id: 4, url: "https://jsonplaceholder.typicode.com/invalid", status: "pending" },
  { id: 5, url: "https://api.github.com/users/octocat", status: "pending" },
  { id: 6, url: "https://jsonplaceholder.typicode.com/posts/6", status: "pending" },
];

function App() {
  // Load links from localStorage or use defaultLinks, resetting status to "pending"
  const [links, setLinks] = useState(() => {
    const savedLinks = localStorage.getItem("sync_async_links");
    const loadedLinks = savedLinks ? JSON.parse(savedLinks) : defaultLinks;
    // Reset all statuses to "pending" on load
    return loadedLinks.map((link) => ({ ...link, status: "pending" }));
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [newLink, setNewLink] = useState(""); // For adding new links
  const [editLinkId, setEditLinkId] = useState(null); // For editing links
  const [editLinkUrl, setEditLinkUrl] = useState(""); // Edited URL
  const [syncTime, setSyncTime] = useState(null); // Sync execution time
  const [asyncTime, setAsyncTime] = useState(null); // Async execution time

  // Save links to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("sync_async_links", JSON.stringify(links));
  }, [links]);

  // Reset all statuses to pending
  const resetLinks = () => {
    setLinks(links.map((link) => ({ ...link, status: "pending" })));
  };

  // Real fetch function
  const realFetch = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  };

  // Synchronous download: one by one
  const downloadSync = async () => {
    setIsDownloading(true);
    resetLinks();
    const updatedLinks = [...links];
    const startTime = performance.now(); // Start timing

    for (let i = 0; i < updatedLinks.length; i++) {
      try {
        const data = await realFetch(updatedLinks[i].url);
        updatedLinks[i].status = "downloaded";
        setLinks([...updatedLinks]);
      } catch (error) {
        updatedLinks[i].status = "error";
        setLinks([...updatedLinks]);
      }
    }

    const endTime = performance.now(); // End timing
    setSyncTime((endTime - startTime).toFixed(2)); // Set execution time in ms
    setIsDownloading(false);
  };

  // Asynchronous download: all at once
  const downloadAsync = async () => {
    setIsDownloading(true);
    resetLinks();
    const updatedLinks = [...links];
    const startTime = performance.now(); // Start timing

    const promises = updatedLinks.map((link, index) =>
      realFetch(link.url)
        .then((data) => {
          updatedLinks[index].status = "downloaded";
          setLinks([...updatedLinks]);
        })
        .catch((error) => {
          updatedLinks[index].status = "error";
          setLinks([...updatedLinks]);
        })
    );

    await Promise.all(promises);
    const endTime = performance.now(); // End timing
    setAsyncTime((endTime - startTime).toFixed(2)); // Set execution time in ms
    setIsDownloading(false);
  };

  // Retry a single failed download
  const retryDownload = async (id) => {
    const updatedLinks = [...links];
    const index = updatedLinks.findIndex((link) => link.id === id);
    updatedLinks[index].status = "pending";
    setLinks([...updatedLinks]);

    try {
      const data = await realFetch(updatedLinks[index].url);
      updatedLinks[index].status = "downloaded";
      setLinks([...updatedLinks]);
    } catch (error) {
      updatedLinks[index].status = "error";
      setLinks([...updatedLinks]);
    }
  };

  // Add a new link
  const addLink = () => {
    if (newLink.trim() === "") return;
    const newId = Math.max(...links.map((link) => link.id), 0) + 1;
    const updatedLinks = [...links, { id: newId, url: newLink, status: "pending" }];
    setLinks(updatedLinks);
    setNewLink(""); // Clear input
  };

  // Start editing a link
  const startEditing = (id, url) => {
    setEditLinkId(id);
    setEditLinkUrl(url);
  };

  // Save edited link
  const saveEdit = (id) => {
    const updatedLinks = links.map((link) =>
      link.id === id ? { ...link, url: editLinkUrl } : link
    );
    setLinks(updatedLinks);
    setEditLinkId(null); // Exit edit mode
    setEditLinkUrl(""); // Clear edit input
  };

  // Delete a link
  const deleteLink = (id) => {
    const updatedLinks = links.filter((link) => link.id !== id);
    setLinks(updatedLinks);
  };

  return (
    <div className="app-container">
      {/* Render fireflies */}
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="firefly" />
      ))}
      <div className="card">
        <h1 className="title">Download Manager</h1>

        {/* Add new link */}
        <div className="add-link">
          <input
            type="text"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="Enter a new URL"
            className="input-url"
            disabled={isDownloading}
          />
          <button
            onClick={addLink}
            className="add-btn"
            disabled={isDownloading}
          >
            Add Link
          </button>
        </div>

        {/* Buttons to trigger downloads */}
        <div className="button-group">
          <button
            onClick={downloadSync}
            disabled={isDownloading}
            className={`btn ${isDownloading ? "btn-disabled" : "btn-sync"}`}
          >
            Sequential Download
          </button>
          <button
            onClick={downloadAsync}
            disabled={isDownloading}
            className={`btn ${isDownloading ? "btn-disabled" : "btn-async"}`}
          >
            Parallel Download
          </button>
        </div>

        {/* Execution time display */}
        <div className="button-group">
          <div className={syncTime && "btn btn-sync"}>{syncTime && <p>{syncTime} ms</p>}</div>
          <div className={asyncTime && "btn btn-async"}>{asyncTime && <p>{asyncTime} ms</p>}</div>
        </div>

        {/* Loading indicator */}
        {isDownloading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}
        {/* List of links with status */}
        <div className="link-container">
        <ul className="link-list">
          {links.map((link) => (
            <li key={link.id} className="link-item">
              {editLinkId === link.id ? (
                <div className="edit-container">
                  <input
                    type="text"
                    value={editLinkUrl}
                    onChange={(e) => setEditLinkUrl(e.target.value)}
                    className="input-url"
                  />
                  <button
                    onClick={() => saveEdit(link.id)}
                    className="save-btn"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="link-url">{link.url}</p>
                    <p
                      className={`link-status ${
                        link.status === "downloaded"
                          ? "status-downloaded"
                          : link.status === "error"
                          ? "status-error"
                          : "status-pending"
                      }`}
                    >
                      Status: {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                    </p>
                  </div>
                  <div className="link-actions">
                    <button
                      onClick={() => startEditing(link.id, link.url)}
                      className="edit-btn"
                      disabled={isDownloading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="delete-btn"
                      disabled={isDownloading}
                    >
                      Delete
                    </button>
                    {link.status === "error" && (
                      <button
                        onClick={() => retryDownload(link.id)}
                        className="retry-btn"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <br/>
        <br/>
        <br/>
        <br/>
        </div>

        
      </div>
    </div>
  );
}

export default App;