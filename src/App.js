import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown'
import './App.css';

const url = "https://api.graphql.jobs/"
const query = `
  query {
    jobs {
      id
      title
      cities {
        name
        id
      }
      description
      company {
        id
        name
        websiteUrl
      }
      postedAt
    }
  }
`

const cleanData = jobs => {
  return jobs.map(job => {
    if (job.cities.length === 0) {
      job.cities[0] = 'NO_CITY';
      job.citiesString = "Remote / No Location"
    }
    else if (job.cities.length === 1) {
      job.cities = [job.cities[0].name];
      job.citiesString = job.cities[0];
    }
    else {
      job.cities = job.cities.map(city => city.name)
      job.citiesString = job.cities.join(" • ")
    }
    job.postedAt = new Date(job.postedAt);
    return job;
  })
}

const sortJobsByRecentDate = jobs => {
  return jobs.sort((a, b) => {
    return b.postedAt - a.postedAt;
  })
}

const JobTab = ({ job, jobs }) => {
  const [renderDescription, setRenderDescription] = useState(false);
  return (
    <div className="job-tab" style={{ backgroundColor: renderDescription ? 'rgb(131 130 140 / 10%)' : null }}>
      <div className="job-vis" onClick={() => setRenderDescription(!renderDescription)}>
        <div className="job-header">
        <div className="job-title">
          {job.title} • <b>{job.company.name}</b>
        </div>
        <div className="job-location">
          {job.citiesString} • {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit"
          }).format(job.postedAt)}
        </div>
      </div>
       { renderDescription ?
        <div className="job-description">
          <div className="job-description-title">Description</div>
          <ReactMarkdown>
            {job.description}
          </ReactMarkdown>
          <div className="job-contact">
            <div className="job-application-btn" onClick={() => window.open(job.company.websiteUrl)}>
              Apply Here
            </div>
          </div>
        </div> :
        null
       }
    </div>
  </div>
)}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      jobs: [],
      displayedJobs: [],
      locationSearch: '',
      jobsLoaded: false,
    }
    this.debouncedSetDisplayedJobs = debounce(jobs => {
      this.setState({ displayedJobs: jobs })
    }, 150);
  }

  componentDidMount() {
    const opts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    };

    fetch(url, opts)
      .then(res => res.json())
      .then(({ data }) => {
        let jobs = cleanData(data.jobs);
        jobs = sortJobsByRecentDate(jobs);
        this.setState({ jobs, displayedJobs: jobs, jobsLoaded: true });
      })
      .catch(console.error);
  }

  handleChange = e => {
    e.preventDefault();

    this.setState({ locationSearch: e.target.value }, () => {
      if (this.state.locationSearch === '') {
        this.debouncedSetDisplayedJobs(this.state.jobs)
        // this.setState({ displayedJobs: this.state.jobs });
      } else {
        const filteredJobs = this.state.jobs.filter(job => job.citiesString.toLowerCase().includes(e.target.value));
        this.debouncedSetDisplayedJobs(filteredJobs)
        // this.setState({ displayedJobs: filteredJobs });
      }
    });
  }

  render() {
    return (
      <div className="app">
        <div className="container">
          <div className="title">
            Walmart AngelList
          </div>
          <div className="job-filters">
            Search jobs by city {" "}
            <input className="job-location-search" value={this.state.locationSearch} onChange={this.handleChange} />
          </div>
          <div className="open-positions">
            Open Positions
          </div>
          <div className="job-content">
             { this.state.displayedJobs.length !== 0 || this.state.jobsLoaded ?
              this.state.displayedJobs.map(job => <JobTab key={job.id} job={job} jobs={this.state.jobs} />) :
              <div className="loader" /> }
          </div>
          </div>
      </div>
    );
  }
}

export default App;

// Helpers
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  }
}
