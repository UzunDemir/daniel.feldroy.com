import Head from 'next/head'
import Link from 'next/link'
import utilStyles from '../styles/utils.module.css'
import Layout, { siteTitle } from '../components/layout'

export default function Jobs() {
  return (
    <Layout>
      <Head>
        <title>Jobs</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <h1 className={utilStyles.headingXl}>Jobs</h1>
        <p>These are employers who I can confirm are good to work for, who take care of their people. They are lead by people with a strong sense of ethics and try to do good by the world.
      </p>

        <ul>
          <li>
            <a href="https://jobs.lever.co/octoenergy?location=Houston" target="_blank">Octopus Energy</a><br />
            This is my company, providing renewable energy and fighting against climate change. How awesome is that? We do Python on the backend and React on the frontend.
          </li>
          <li>
            <a href="https://sixfeetup.com/company/careers" target="_blank">Six Feet Up</a><br />
            A consultancy run by friends of mine, Six Feet Up.

          </li>
        </ul>
      </section>
    </Layout>
  )
}
