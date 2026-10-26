import { defineQuery } from "next-sanity";

const topicProjection = `topics[]->{ _id, title, "slug": slug.current }`;

const sourceSummary = `{
  _id, title, publisher, date, originalUrl, language, rightsStatus, hostingPolicy,
  "fileUrl": select(hostingPolicy == "full" => file.asset->url, null)
}`;

const imageProjection = `"image": select(defined(image.asset) => { "url": image.asset->url, "alt": image.alt, "credit": image.credit }, null)`;

const reviewSummary = `{
  _id,
  "slug": slug.current,
  question,
  ${imageProjection},
  shortAnswer,
  finding,
  claimType,
  reviewDate,
  "topics": ${topicProjection}
}`;

export const allReviewsQuery = defineQuery(`
  *[_type == "claimReview" && defined(slug.current)] | order(reviewDate desc, _updatedAt desc) ${reviewSummary}
`);

export const reviewBySlugQuery = defineQuery(`
  *[_type == "claimReview" && slug.current == $slug][0]{
    _id,
    "slug": slug.current,
    question,
    ${imageProjection},
    shortAnswer,
    finding,
    claimType,
    reviewDate,
    "topics": ${topicProjection},
    claimText,
    claimLanguage,
    claimTranslation,
    translator,
    speaker,
    publisher,
    statementDate,
    originalUrl,
    "capture": capture{
      captureDate, captureMethod, waybackUrl, archiveUnavailable, archiveNote,
      "captureFileUrl": captureFile.asset->url
    },
    evidence[]{
      ...,
      markDefs[]{
        ...,
        _type == "citation" => { ..., "source": source->${sourceSummary} }
      }
    },
    limitations,
    searchKeywords,
    reviewer,
    corrections,
    _updatedAt
  }
`);

/** Up to three other reviews sharing a topic, newest first, falling back to the newest overall. */
export const relatedReviewsQuery = defineQuery(`
  *[_type == "claimReview" && defined(slug.current) && _id != $id && count((topics[]._ref)[@ in $topicIds]) > 0]
    | order(reviewDate desc)[0...3] ${reviewSummary}
`);

export const latestReviewsQuery = defineQuery(`
  *[_type == "claimReview" && defined(slug.current) && _id != $id] | order(reviewDate desc)[0...3] ${reviewSummary}
`);

export const reviewSlugsQuery = defineQuery(`
  *[_type == "claimReview" && defined(slug.current)].slug.current
`);

export const allTopicsQuery = defineQuery(`
  *[_type == "topic"] | order(title asc){
    _id, title, "slug": slug.current, description,
    "count": count(*[_type == "claimReview" && defined(slug.current) && references(^._id)])
  }
`);

export const searchDocsQuery = defineQuery(`
  *[_type == "claimReview" && defined(slug.current)]{
    "id": "review:" + slug.current,
    "type": "review",
    "url": "/reviews/" + slug.current,
    "title": question,
    question,
    claimText,
    claimTranslation,
    shortAnswer,
    finding,
    "topics": topics[]->slug.current,
    "topicTitles": topics[]->title,
    searchKeywords,
    "body": array::join(array::compact([speaker, publisher]), " "),
    "evidenceText": pt::text(evidence)
  } + *[_type == "source"]{
    "id": "source:" + _id,
    "type": "source",
    "url": "/sources/" + _id,
    title,
    "subtitle": array::join(array::compact([publisher, string(date)]), " · "),
    "body": array::join(array::compact([publisher, language, notes]), " "),
    "searchKeywords": []
  } + *[_type == "dataset"]{
    "id": "dataset:" + _id,
    "type": "dataset",
    "url": "/datasets",
    title,
    "subtitle": array::join(array::compact([source->title, geographicCoverage]), " · "),
    "body": array::join(array::compact([description, source->title, geographicCoverage, units, methodology, limitations]), " "),
    "searchKeywords": []
  }
`);

export const allSourcesQuery = defineQuery(`
  *[_type == "source"] | order(date desc, title asc){
    _id, title, publisher, date, originalUrl, language, rightsStatus, hostingPolicy,
    "fileUrl": select(hostingPolicy == "full" => file.asset->url, null),
    "citedByCount": count(*[_type == "claimReview" && references(^._id)])
  }
`);

export const sourceByIdQuery = defineQuery(`
  *[_type == "source" && _id == $id][0]{
    _id, title, publisher, date, originalUrl, language, rightsStatus, hostingPolicy, notes,
    "fileUrl": select(hostingPolicy == "full" => file.asset->url, null),
    "relatedSources": relatedSources[]->${sourceSummary},
    "citedBy": *[_type == "claimReview" && references(^._id) && defined(slug.current)]{ question, "slug": slug.current }
  }
`);

export const allDatasetsQuery = defineQuery(`
  *[_type == "dataset"] | order(title asc){
    _id, title, description, periodStart, periodEnd, geographicCoverage, units, methodology, limitations,
    "source": source->${sourceSummary},
    "fileUrl": file.asset->url,
    "fileName": file.asset->originalFilename
  }
`);

export const correctionsQuery = defineQuery(`
  *[_type == "claimReview" && defined(slug.current) && count(corrections) > 0]{
    question, "slug": slug.current, corrections
  }
`);

export const pageBySlugQuery = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{ title, body }
`);
