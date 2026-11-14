#!/usr/bin/env node
/* Real-browser quality gate and optional real-UI screencast.
 * No artificial ephemerides, mock data, or AI-rendered lunar imagery.
 * Browser loads the exact published files served locally from docs/.
 */
"use strict";
const { chromium } = require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const target="http://127.0.0.1:8765";
const artifact=path.resolve(process.cwd(),"artifacts/browser");
fs.mkdirSync(artifact,{recursive:true});
const quiet=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const browser=await chromium.launch({headless:true});
 let pageErrors=[];
 // A reproducible visual regression of the real public-app build.
 const context=await browser.newContext({viewport:{width:1366,height:800},deviceScaleFactor:1,recordVideo:{dir:artifact,size:{width:1280,height:720}}});
 const page=await context.newPage();
 page.on("pageerror",e=>pageErrors.push(e.message));
 await page.goto(target+"/mission-console.html",{waitUntil:"load"});
 await page.locator("#currentDate").waitFor({state:"visible"});
 await page.waitForFunction(()=>document.querySelector("#currentDate").textContent.includes("UTC"));
 assert.match(await page.locator("#datasetStatus").innerText(),/745 actual JPL UTC epochs/);
 await page.screenshot({path:path.join(artifact,"01-landing.png"),fullPage:true});
 await quiet(1100);
 // The real NASA 5-minute demo: Site01, Dec 21, 6h, 100W, 72h permitted delay.
 assert.equal(await page.locator("#startUtc").inputValue(),"2026-12-21T00:00");
 assert.equal(await page.locator("#earthRequired").isChecked(),true);
 const invalid=await page.locator("#planForm").evaluate(form=>[...form.elements].filter(x=>x.willValidate&&!x.checkValidity()).map(x=>({id:x.id,validity:x.validity.stepMismatch?"stepMismatch":"invalid"})));
 assert.deepEqual(invalid,[],"Valid source demo settings must be accepted by native HTML validation");
 await page.locator("#evaluate").click();
 await page.waitForTimeout(2000);
 console.log("DEBUG CASES:",await page.locator("#caseCount").innerText());
 console.log("DEBUG REPORT:",(await page.locator("#report").innerText()).slice(0,1600));
 console.log("DEBUG JS ERRORS:",pageErrors);
 await page.screenshot({path:path.join(artifact,"diagnostic-after-evaluate.png"),fullPage:true});
 await page.waitForFunction(()=>document.querySelector("#caseCount").textContent.includes("1730 cases screened at 5-minute"),{timeout:12000});
 assert.match(await page.locator("#report").innerText(),/UNKNOWN/);
 assert.match(await page.locator("#caseCount").innerText(),/0 certified alternatives/);
 assert.equal(await page.locator("#exportBtn").isEnabled(),true);
 await page.locator("#results").scrollIntoViewIfNeeded();
 await quiet(1600);
 await page.screenshot({path:path.join(artifact,"02-actual-nasa-rescue.png"),fullPage:true});
 // The scientific uncertainty must never disappear after changing panels.
 await page.locator("#requiredPowerW").fill("110");
 assert.match(await page.locator("#report").innerText(),/inputs changed|Previous findings are no longer current/);
 assert.equal(await page.locator("#exportBtn").isDisabled(),true);
 await quiet(900);
 // Switch to a different real NASA location and re-run. Same hardware.
 await page.locator("#site04Btn").click();
 await page.locator("#evaluate").click();
 assert.match(await page.locator("#report").innerText(),/Site Site04/);
 assert.match(await page.locator("#report").innerText(),/UNKNOWN/);
 await quiet(1000);
 await page.screenshot({path:path.join(artifact,"03-second-site.png"),fullPage:true});
 // Accessible 7-slide source-credited, no generated simulated sky images.
 const slidePage=await context.newPage();
 slidePage.on("pageerror",e=>pageErrors.push(e.message));
 await slidePage.goto(target+"/judges-slides.html",{waitUntil:"load"});
 assert.equal(await slidePage.locator(".slide").count(),7);
 assert.equal(await slidePage.locator(".slide.active").count(),1);
 await slidePage.locator("#next").click();
 assert.match(await slidePage.locator("#count").innerText(),/2 \/ 7/);
 await slidePage.keyboard.press("ArrowLeft");
 assert.match(await slidePage.locator("#count").innerText(),/1 \/ 7/);
 await slidePage.screenshot({path:path.join(artifact,"04-judges-slides.png"),fullPage:false});
 await slidePage.close();
 await quiet(300);
 const video=await page.video().path();
 await context.close();
 // Playwright finalizes the real browser video on context.close().
 fs.copyFileSync(video,path.join(artifact,"mission-rescue-real-browser.webm"));
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
 const phone=await mobile.newPage();phone.on("pageerror",e=>pageErrors.push(e.message));
 await phone.goto(target+"/mission-console.html",{waitUntil:"load"});
 await phone.waitForFunction(()=>document.querySelector("#datasetStatus").textContent.includes("745 actual"));
 await phone.screenshot({path:path.join(artifact,"05-mobile.png"),fullPage:true});
 assert.equal(await phone.locator("#evaluate").isVisible(),true);
 await phone.locator("#evaluate").click();
 assert.match(await phone.locator("#caseCount").innerText(),/5-minute/);
 await mobile.close();await browser.close();
 assert.deepEqual(pageErrors,[],"JavaScript browser exceptions");
 console.log("PASS Chromium desktop/mobile real NASA, 1730 5-minute cases, stale-setting protection, 7-slide navigation, true UI video");
}
main().catch(e=>{console.error(e);process.exit(1)});
