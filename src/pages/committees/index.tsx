import Header from "@/components/header"
import { Committee, CommitteeCountries, CommitteeMember } from "@prisma/client"
import { Committee as CommitteeSchema } from "@/utils/validators"
import { z } from "zod"
import { db } from "@/utils/db"
import { NextPage } from "next"
import React from "react"
import ENV from "@/utils/env"
import Link from "next/link"
import Image from "next/image"

interface CommitteesProps {
  committees: Committee[]
  // committeeCountries: CommitteeCountries[]
  // chairs: CommitteeMember[]
}

interface SingleCommitteeProps {
  committee: Committee
  // committeeCountries: CommitteeCountries[]
  // chairs: CommitteeMember[]
}

const Committee = ({ committee }: SingleCommitteeProps) => {
  return (
    <article className="c-project-card col col-4 col-d-6 col-t-12">
      <div className="c-project-card__content">
        <Link href={`/committees/${committee.id}`}>
          <a className="c-project-card__image">
            <Image src={"/images/uw.png"} layout="fill" />
          </a>
        </Link>
        <div className="c-project-card__info">
          <div className="c-project-card__info-wrap">
            <h3 className="c-project-card__title-shown">
              {committee.displayname}
            </h3>
            <p className="c-project-card__subtitle">({committee.difficulty})</p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function ({ committees }: CommitteesProps) {
  return (
    <div className="c-page">
      <div className="container">
        <div className="container animate">
          <Header title="COMMITTEES" />

          <div className="row" style={{ justifyContent: "center" }}>
            {committees.map((committee, i) => (
              <Committee committee={committee} key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps() {
  // const committees = await fetch("/api/committees").then((r) => r.json())
  const committees = await db.committee.findMany()

  const data = z.array(CommitteeSchema).parse(committees)

  return {
    props: {
      committees: data,
    },

    // re-generate the page's data at most every 24h (60s*60m*24h) ONLY ON PROD
    // re-generates ONLY if a request comes in, it doesn't re-generate the page if no requests come in
    // on dev, regenerate every second so that it is up to date
    revalidate: ENV.isDev ? 1 : 60 * 60 * 24,
  }
}
