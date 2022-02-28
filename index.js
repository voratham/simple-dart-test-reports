const fs = require("fs");
const clc = require("cli-color");
const _ = require("lodash")

let notLogTest = true

if(!process.argv[2] || process.argv[2] === ''){
    console.log('🔴 Please add path file i.e.  "node index.js ./machine.log --total"  ')
    return;
}
if(process.argv[3] && process.argv[3] == "--total"){
    notLogTest = process.argv[3] == "--total" ? false : true
}


const PATH = `${process.argv[2]}`

const arrJson = [];
const ERROR_START = "EXCEPTION CAUGHT BY FLUTTER TEST FRAMEWORK"
const ERROR_END = "════════════════════════════════════════════════════════════════════════════════════════════════════"


console.log(clc.green(`🟢 Read file  ${PATH} \n`))

try {
  const content = fs
    .readFileSync(PATH, { encoding: "utf8", flag: "r" })
    .split(/\r?\n/);

  for (const line of content) {
    try {
      const _data = JSON.parse(line);
      arrJson.push(_data);
    } catch (error) {
      continue;
    }
  }

  const testObjectByID = _.groupBy(arrJson, 'test.id')
  delete testObjectByID['undefined']
  Object.keys(testObjectByID).forEach( key => {
    testObjectByID[key] = testObjectByID[key][0]
  })

  const totalTest = {
      'success' : 0,
      'failure' : 0,
  }

  
  
  const grouped = _.mapValues(_.groupBy(arrJson, 'testID'), (data) => data);
  
  for (const groupID of _.keys(grouped)) {
    for (const item of grouped[groupID]) {
        // Read test error
        if(item.message && item.message.includes(ERROR_START)){
            if(notLogTest){
                console.log(`🚫 `+ clc.red.bold(`(TestID: ${groupID}) ${clc.red.bold(`TestName: "${testObjectByID[groupID].test.name}"`)} \n\n`))
            }
            let logStart = false


            for (const item2 of grouped[groupID]) {
                if(item2.message && item2.message.includes(ERROR_START)){
                    logStart = true   
                    continue
                }

                if(item2.message && item2.message.includes(ERROR_END)){
                    continue
                }
                
                
                if(item2.error){
                    logStart =false
                    if(notLogTest){
                        console.log('\t' , clc.red(`${item2.error}`) ,'\n')
                    }
                    totalTest['failure'] +=1;
                    break
                }
                
                if(logStart && notLogTest == true){
                    console.log('\t' ,  clc.red(`${item2.message}`) )
                }
            }
            if(notLogTest){
                console.log('--------------------------------------------')
            }
        }

        // Read test success
        if(item.result && item.result === 'success'){
            if(notLogTest){
                console.log(`✅ (TestID: ${groupID}) TestName: "${testObjectByID[groupID].test.name}" `)
                console.log('--------------------------------------------')
            }
            totalTest['success'] +=1;
        }
    }
  }

    console.log('Summary')
    console.log(clc.red(`Failure: ${totalTest['failure']}`))
    console.log(clc.green(`Success: ${totalTest['success']}`))
    console.log(clc.cyanBright(`Total: ${totalTest['success'] +totalTest['failure'] }`))

} catch (error) {
    if(error.code =='ENOENT'){
        console.log("🔴 Invalid destination file: ", PATH);
        console.log('🔴 Please add path file i.e.  "node index.js machine.log"  ')
        return
    }
    console.log("🔴 Something went wrong: ", error);
}
