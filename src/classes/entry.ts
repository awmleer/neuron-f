import * as moment from 'moment'

// export class EntryRecord {
//     word:string
//     proficiency:number;//range from 0 to 8
//     createdAt:number
//     wait:number=0
//     constructor (word:string, proficiency:number){
//         this.word=word
//         this.proficiency=proficiency
//         this.createdAt=moment().valueOf()
//     }
// }

export interface EntryRecord {
  id: number
  proficiency: number//range from 0 to 8
  createdAt: number
  updatedAt: number
  nextReviewDate: number
  entry: EntryBrief
  starredSentenceIds: number[]
}


export interface EntryBrief {
  word: string
  rank: number
  definitions: {
    part: string
    text: string
  }[]
  pronounce: {
    UK: string,
    US: string
  }
  sentences: Sentence[]
}


export interface Sentence {
  id: number
  chinese: string
  english: string
  reference: string
}
