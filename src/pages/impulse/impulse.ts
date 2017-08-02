import {Component} from '@angular/core';
import {NavParams, ActionSheetController} from 'ionic-angular';
import { NavController } from 'ionic-angular';
import {WordService} from "../../services/word.service";
import {WordImpulsing, WordRecord} from "../../classes/word";
import {SettingService} from "../../services/setting.service";
import * as _ from "lodash"



@Component({
    selector: 'page-impulse',
    templateUrl: 'impulse.html'
})
export class ImpulsePage {
    amount:number;
    wordsImpulsing:WordImpulsing[];
    wordsRendering:WordImpulsing[]=[null,null];
    cardExpandingFlags:boolean[]=[false,false];
    type:'learn'|'review';
    lastWordImpulsing:WordImpulsing;
    lastWordRecord:WordRecord;
    shouldAnimate:boolean=false;


    constructor(
        public nav: NavController,
        private navParams: NavParams,
        public wordService:WordService,
        public settingService: SettingService,
        public actionSheetCtrl:ActionSheetController
    ) {}

    ngOnInit(): void {
        this.type=this.navParams.get('type');
        if (this.type == 'learn') {
            this.wordsImpulsing=this.wordService.wordsLearning;
        }else if (this.type == 'review') {
            this.wordsImpulsing=this.wordService.wordsReviewing;
        }
        this.amount=this.wordsImpulsing.length;
        this.nextWord();
        this.shouldAnimate=true;
    }



    nextWord():void{
        let allDone=true;
        for (let i = 0; i < this.wordsImpulsing.length; i++) {
            if (this.wordsImpulsing[i].wait==0) {
                // this.wordsRendering[1]=this.wordsImpulsing[i];
                this.transitNext(this.wordsImpulsing[i]);
                // this.initWord();
                return;
            }else {
                if(this.wordsImpulsing[i].wait!=-1)allDone=false;
            }
        }
        if (allDone) {
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


    transitNext(word:WordImpulsing){
        if (this.shouldAnimate) {
            // this.zone.run(()=>{
            // });
            this.wordsRendering.push(word);
            this.cardExpandingFlags.push(false);
            // this.applicationRef.tick();
            setTimeout(()=>{
                this.wordsRendering.shift();
                this.cardExpandingFlags.shift();
            },10);
        }else{
            this.wordsRendering.push(word);
            this.cardExpandingFlags.push(false);
            this.wordsRendering.shift();
            this.cardExpandingFlags.shift();
        }
    }


    cacheLastWord():void{
        this.lastWordImpulsing=_.cloneDeep(this.wordsRendering[1]);
        this.lastWordRecord=_.cloneDeep(this.wordService.wordRecords[this.wordsRendering[1].word]);
    }


    rewind():void{
        for (let i in this.wordsImpulsing) {
            if (this.wordsImpulsing[i].word == this.lastWordImpulsing.word) {
                this.wordsImpulsing[i]=_.cloneDeep(this.lastWordImpulsing);
                this.wordsRendering[1]=this.wordsImpulsing[i];
            }
        }
        if (this.lastWordRecord) {
            this.wordService.wordRecords[this.lastWordImpulsing.word]=_.cloneDeep(this.lastWordRecord);
        }else {
            delete this.wordService.wordRecords[this.lastWordImpulsing.word];
        }
        this.wordService.saveWordRecords();
        // this.initWord();
        this.lastWordImpulsing=null;
        this.lastWordRecord=null;
        // this.nextWord();
    }


    finish():void{
        if (this.type == 'learn') {
            this.wordService.removeWordsLearning();
        }else if (this.type == 'review') {
            this.wordService.saveWordsImpulsing(this.type);
        }
        this.nav.pop();
    }

    clickKnow():void{
        this.cacheLastWord();
        if (this.wordsRendering[1].dirty==0) {//First time today
            this.wordsRendering[1].dirty=1;
            this.wordsRendering[1].wait=-1;//never show this word today
            if(this.type=='learn')this.wordService.addRecord(this.wordsRendering[1].word,'know');
            if(this.type=='review')this.wordService.moltRecord(this.wordsRendering[1].word,'know');
        }else {
            this.wordsRendering[1].count+=1;
            if (this.wordsRendering[1].count == 6) {//if count reaches 6
                this.wordsRendering[1].wait=-1;//this word is done for today
                if (this.wordsRendering[1].dirty == 2) {
                    if(this.type=='learn')this.wordService.addRecord(this.wordsRendering[1].word,'vague');
                    if(this.type=='review')this.wordService.moltRecord(this.wordsRendering[1].word,'vague');
                }else if (this.wordsRendering[1].dirty == 3) {
                    if(this.type=='learn')this.wordService.addRecord(this.wordsRendering[1].word,'forget');
                    if(this.type=='review')this.wordService.moltRecord(this.wordsRendering[1].word,'forget');
                }
            }else {
                this.wordsRendering[1].wait=this.wordsRendering[1].count*2+1;
            }
        }
        this.nextWord();
    }

    clickVague():void{
        this.cacheLastWord();
        if (this.wordsRendering[1].dirty==0) {//First time today
            this.wordsRendering[1].count=3;
            this.wordsRendering[1].wait=2;
            this.wordsRendering[1].dirty=2;
        }else {
            //currentWord.count do not change
            this.wordsRendering[1].wait=this.wordsRendering[1].count*2+1;
        }
        this.nextWord();
    }

    clickForget():void{
        this.cacheLastWord();
        if (this.wordsRendering[1].dirty==0) {//First time today
            this.wordsRendering[1].count=1;
            this.wordsRendering[1].wait=2;
            this.wordsRendering[1].dirty=3;
        }else {
            if(this.wordsRendering[1].count>0)this.wordsRendering[1].count--;
            this.wordsRendering[1].wait=this.wordsRendering[1].count*2+1;
        }
        this.nextWord();
    }

    markAsMaster():void{
        if(this.type=='learn')this.wordService.addRecord(this.wordsRendering[1].word,'master');
        if(this.type=='review')this.wordService.moltRecord(this.wordsRendering[1].word,'master');
        this.wordsRendering[1].wait=-1;//never show it today
        this.wordsRendering[1].dirty=4;
        this.nextWord();
    }


    showActionSheet():void{
        let actionSheet=this.actionSheetCtrl.create({
            title:'更多操作',
            buttons:[
                {
                    text:`当前队列：共${this.amount}个单词`
                },
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


    expandCard(i){
        console.log(i);
        this.cardExpandingFlags[i]=true;
    }

    // ionViewWillLeave():void{
    //     console.log('will leave this page');
    // }

}
