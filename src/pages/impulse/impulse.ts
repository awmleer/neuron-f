import {Component} from '@angular/core';
import {NavParams, ActionSheetController} from 'ionic-angular';
import { NavController } from 'ionic-angular';
import {RepoDetail} from "../../classes/repo";
import {WordService} from "../../services/word.service";
import {WordEntry, WordImpulsing} from "../../classes/word";


@Component({
    selector: 'page-impulse',
    templateUrl: 'impulse.html'
})
export class ImpulsePage {
    amount:number;
    wordsImpulsing:WordImpulsing[];
    currentWord:any;
    type:string;
    entry:WordEntry;
    constructor(
        public nav: NavController,
        private navParams: NavParams,
        public wordService:WordService,
        public actionSheetCtrl:ActionSheetController
    ) {}

    ngOnInit(): void {
        this.type=this.navParams.get('type');
        if (this.type == 'learn') {
            this.wordsImpulsing=this.wordService.wordsLearning;
        }else if (this.type == 'review') {
            this.wordsImpulsing=this.wordService.wordsReviewing;
        }
        //todo: check navParams->type==learn or review
        this.amount=this.wordsImpulsing.length;
        this.nextWord();
    }

    nextWord():void{
        let allDone=true;
        for (let i = 0; i < this.wordsImpulsing.length; i++) {
            if (this.wordsImpulsing[i].wait==0) {
                this.currentWord=this.wordsImpulsing[i];
                this.wordService.getEntry(this.wordsImpulsing[i].word)
                    .then(entry=>{
                        this.entry=entry;
                    });
                this.wordService.saveWordsImpulsing(this.type);
                return;
            }else {
                if(this.wordsImpulsing[i].wait!=-1)allDone=false;
            }
        }
        if (allDone) {
            //todo do something
            console.log('all words are done');
            this.finish();
            return;
        }
        //if all wordImpulsing.wait > 0
        for (let i = 0; i < this.wordsImpulsing.length; i++) {
            if (this.wordsImpulsing[i].wait > 0) {
                this.wordsImpulsing[i].wait--;
            }
        }
        this.nextWord();
    }

    finish():void{
        if (this.type == 'learn') {
            this.wordService.removeWordsLearning();
        }
        this.nav.pop();
    }

    clickKnow():void{
        if (this.currentWord.dirty==0) {//First time today
            //if in learn mode
            //add word to records
            this.wordService.addRecord(this.currentWord.word,'know');
            this.currentWord.dirty=1;
            this.currentWord.wait=-1;//never show this word today
        }else {
            this.currentWord.count+=1;
            if (this.currentWord.count == 6) {//if count reaches 6
                this.currentWord.wait=-1;//this word is done for today
                if (this.currentWord.dirty == 2) {
                    this.wordService.addRecord(this.currentWord.word,'vague');
                }else if (this.currentWord.dirty == 3) {
                    this.wordService.addRecord(this.currentWord.word,'forget');
                }
            }else {
                this.currentWord.wait=this.currentWord.count*2;
            }
        }
        this.nextWord();
    }

    clickVague():void{
        if (this.currentWord.dirty==0) {//First time today
            this.currentWord.count=3;
            this.currentWord.wait=2;
            this.currentWord.dirty=2;
        }else {
            //currentWord.count do not change
            this.currentWord.wait=this.currentWord.count*2;
        }
        this.nextWord();
    }

    clickForget():void{
        if (this.currentWord.dirty==0) {//First time today
            this.currentWord.count=1;
            this.currentWord.wait=2;
            this.currentWord.dirty=3;
        }else {
            if(this.currentWord.count>0)this.currentWord.count--;
            this.currentWord.wait=this.currentWord.count*2;
        }
        this.nextWord();
    }

    markAsMaster():void{
        if(this.type=='learn')this.wordService.addRecord(this.currentWord.word,'master');
        if(this.type=='review'){}//do something
        this.currentWord.wait=-1;//never show it today
        this.currentWord.dirty=4;
        this.nextWord();
    }


    showActionSheet():void{
        let actionSheet=this.actionSheetCtrl.create({
            title:'更多操作',
            buttons:[
                {
                    text:'标记为熟知词',
                    handler:()=>{
                        this.markAsMaster();
                    }
                },
                {
                    text:'取消',
                    role:'cancel'
                }
            ]
        });
        actionSheet.present();
    }

    ionViewWillLeave():void{
        console.log('will leave this page');
    }

}
