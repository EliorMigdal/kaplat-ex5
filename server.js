const express = require('express');
const bunyan = require('bunyan');
const app = express();
app.use(express.json());
const fs = require('fs');
const path = require('path');
const reqLogFilePath = path.join(__dirname, 'logs', 'requests.log');
const todosLogFilePath = path.join(__dirname, 'logs', 'todos.log');
const { performance } = require('perf_hooks');
////////////////////////////////////Creating new files////////////////////////////////////
fs.writeFile(reqLogFilePath, '', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });

fs.writeFile(todosLogFilePath, '', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
////////////////////////////////////Configuring Loggers' Format////////////////////////////////////
class requestsLoggerStream {
  write(record) {
    const logData = JSON.parse(record);
    const logLevel = bunyan.nameFromLevel[logData.level];
    const logMessage = logData.msg;
    const requestNumber = logData.reqId;

    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(currentDate.getMilliseconds()).padStart(3, '0');

    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    const formattedLog = `${formattedDate} ${logLevel.toUpperCase()}: ${logMessage} | request #${requestNumber} `;

    console.log(formattedLog);

    fs.appendFile(reqLogFilePath, formattedLog + '\n', (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  }
}

class todosLoggerStream {
    write(record) {
      const logData = JSON.parse(record);
      const logLevel = bunyan.nameFromLevel[logData.level];
      const logMessage = logData.msg;
      const requestNumber = logData.reqId;
  
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      const hours = String(currentDate.getHours()).padStart(2, '0');
      const minutes = String(currentDate.getMinutes()).padStart(2, '0');
      const seconds = String(currentDate.getSeconds()).padStart(2, '0');
      const milliseconds = String(currentDate.getMilliseconds()).padStart(3, '0');
  
      const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
      const formattedLog = `${formattedDate} ${logLevel.toUpperCase()}: ${logMessage} | request #${requestNumber} `;

      console.log(formattedLog);
  
      fs.appendFile(todosLogFilePath, formattedLog + '\n', (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        }
      });
    }
  }
////////////////////////////////////Loggers Configuration////////////////////////////////////
const requestsLogger = bunyan.createLogger({
    name: 'request-logger',
    level: 'info',
    stream: new requestsLoggerStream()
  });

  const todosLogger = bunyan.createLogger({
    name: 'todo-logger',
    level: 'info',
    stream: new todosLoggerStream()
  });
////////////////////////////////////Global Variables////////////////////////////////////
let todosArr = [];
let idCounter = 1, arrSize = 0, logArrSize = 0, logsCounter = 1;
let startTime, endTime, duration;
////////////////////////////////////Starting the Server////////////////////////////////////
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});
////////////////////////////////////Phase 1////////////////////////////////////
app.get('/todo/health', (req, res) => {
    startTime = performance.now();

    requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
     " | resource: /todo/health | HTTP Verb GET");

    endTime = performance.now();
    duration = endTime - startTime;
    requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter +
     " duration: " + duration + "ms");
     logsCounter++;

     res.status(200).send("OK");
  });
////////////////////////////////////Phase 2////////////////////////////////////
app.post('/todo', (req, res) => 
{
    startTime = performance.now();

    requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
         " | resource: /todo | HTTP Verb POST");

    let titleCheck = true, dateCheck = true;
    let currDate = new Date();

    for (let index = 0; index < idCounter - 1 && titleCheck; index++)
    {
        if (todosArr[index].title === req.body.title)
        {
            todosLogger.error({reqId: logsCounter}, "Error: TODO with the title [" 
            + JSON.stringify(req.body.title) +  "] already exists in the system");

            endTime = performance.now();
            duration = endTime - startTime;
            requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
            + " duration: " + duration + "ms");
            logsCounter++;

            res.status(409).json({ result: '',
            errorMessage: "Error: TODO with the title [" + 
            JSON.stringify(req.body.title) +  "] already exists in the system" });

            titleCheck = false;
        }
    }

    if (titleCheck && currDate.getTime() > req.body.dueDate)
    {
        todosLogger.error({reqId: logsCounter}, "Error: Can't create new TODO that its due date is in the past");

        endTime = performance.now();
        duration = endTime - startTime;
        requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
        + " duration: " + duration + "ms");
        logsCounter++;

        res.status(409).json({ result: '',
        errorMessage: "Error: Can't create new TODO that its due date is in the past" });

        dateCheck = false;
    }

    if (titleCheck && dateCheck)
    {
        todosLogger.info({reqId: logsCounter}, "Creating new TODO with Title [" + req.body.title + "]");
        todosLogger.debug({reqId: logsCounter}, `Currently there are ${logArrSize} TODOs in the system. New TODO will be assigned with id ${idCounter}`);

        const newTODO = 
        {
            id: idCounter,
            title: req.body.title,
            content: req.body.content,
            status: "PENDING",
            dueDate: req.body.dueDate
        }

        todosArr.push(newTODO);

        endTime = performance.now();
        duration = endTime - startTime;
        requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
        + " duration: " + duration + "ms");

        logsCounter++, arrSize++, logArrSize++;
        res.status(200).json({ result: idCounter++, errorMessage: "" });
    }
});
////////////////////////////////////Phase 3////////////////////////////////////
app.get('/todo/size', (req, res) => {
    startTime = performance.now();
    
    let status = req.query.status;
    let checkStatus = true;

    if (status != "ALL" && status != "PENDING" && status != "LATE" && status != "DONE")
    {
        res.status(400).json({ result: '', errorMessage: "Bad Request" });
        checkStatus = false;
    }

    else
    {
        requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
        " | resource: /todo/size | HTTP Verb GET");

        if (checkStatus && status === "ALL")
        {
            todosLogger.info({reqId: logsCounter}, `Total TODOs count for state ${status} is ${logArrSize}`);

            endTime = performance.now();
            duration = endTime - startTime;
            requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
            + " duration: " + duration + "ms");
            logsCounter++;
    
            res.status(200).json({result: logArrSize, errorMessage: ""});
        }

        else
        {
            let resCounter = 0;
            for (let index = 0; index < arrSize; index++)
            {
                if (todosArr[index].status === status)
                {
                    resCounter = resCounter + 1;
                }
            }
    
            todosLogger.info({reqId: logsCounter}, `Total TODOs count for state ${status} is ${resCounter}`);
    
            endTime = performance.now();
            duration = endTime - startTime;
            requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter
            + " duration: " + duration + "ms");
            logsCounter++;
    
            res.status(200).json({result: resCounter, errorMessage: ""});
        }
    }
  });
  ////////////////////////////////////Phase 4////////////////////////////////////
  app.get('/todo/content', (req, res) =>
  {
    startTime = performance.now();
    let status = req.query.status, sortBy = req.query.sortBy;

    if (!sortBy)
    {
        sortBy = "ID";
    }

    let checkStatus = true, checkSort = true;

    if (status != "ALL" && status != "PENDING" && status != "LATE" & status != "DONE")
    {
        checkStatus = false;
        res.status(400).json({ result: '', errorMessage: "Bad Request" });
    }

    else if (checkStatus && (sortBy && (sortBy != "ID" && sortBy != "DUE_DATE" && sortBy != "TITLE") ) )
    {
        checkSort = false;
        res.status(400).json({ result: '', errorMessage: "Bad Request" });
    }

    else if (checkStatus && checkSort)
    {
        requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
         " | resource: /todo/content | HTTP Verb GET");
        
        todosLogger.info({reqId: logsCounter}, `Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`);

        let resArr = [];
        for (let index = 0; index < arrSize; index++)
        {
            if (status == "ALL" || todosArr[index].status === status)
            {
                resArr.push(todosArr[index]);
            }
        }

        if (!sortBy || sortBy === "ID")
        {
            resArr.sort((a, b) => a.id - b.id);
        }

        else if (sortBy === "DUE_DATE")
        {
            resArr.sort((a, b) => a.dueDate - b.dueDate);
        }

        else
        {
            resArr.sort((a, b) => a.title.localeCompare(b.title));
        }
        
        todosLogger.debug({reqId: logsCounter}, `There are a total of ${logArrSize} todos in the system. The result holds ${resArr.length} todos`);

        endTime = performance.now();
        duration = endTime - startTime;
        requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
        + " duration: " + duration + "ms");
        logsCounter++;

        res.status(200).json({result: resArr, errorMessage:""});
    }
  });
////////////////////////////////////Phase 5////////////////////////////////////
  app.put('/todo', (req, res) =>
  {
    startTime = performance.now();

    let param_id = req.query.id ,param_status = req.query.status;
    let checkStatus = true, foundID = false, checkID = true;

    if (param_status != "PENDING" && param_status != "LATE" && param_status != "DONE")
    {
        checkStatus = false;
        res.status(400).json({result:"",errorMessage:"Bad Request"});
    }

    else
    {
        requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
        " | resource: /todo | HTTP Verb PUT");

        for (let index = 0; index < arrSize && !foundID; index++)
        {
            if (todosArr[index].id == param_id)
            {
                foundID = true;
            }
        }

        todosLogger.info({reqId: logsCounter}, `Update TODO id [${param_id}] state to ${param_status}`);

        if (!foundID)
        {
            endTime = performance.now();
            duration = endTime - startTime;
            requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
            + " duration: " + duration + "ms");
    
            checkID = false;
    
            todosLogger.error({reqId: logsCounter++}, `Error: no such TODO with id ${param_id}`);
            res.status(404).json({result:"",errorMessage:`Error: no such TODO with id ${param_id}`});
        }
    
        else if (checkID && checkStatus)
        {
            let oldStatus = todosArr[param_id - 1].status;
            todosArr[param_id - 1].status = param_status;
            todosLogger.debug({reqId: logsCounter}, `Todo id [${param_id}] state change: ${oldStatus} --> ${param_status}`);
    
            endTime = performance.now();
            duration = endTime - startTime;
            requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
            + " duration: " + duration + "ms");
            logsCounter++;
    
            res.json({result:oldStatus, errorMessage:""});
        }
    }
  });
////////////////////////////////////Phase 6////////////////////////////////////
  app.delete('/todo', (req, res) =>
  {
    startTime = performance.now();

    requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
        " | resource: /todo | HTTP Verb DELETE");
    
    let param_id = req.query.id;
    let checkID = true, foundID = false;

    for (let index = 0; index < arrSize && !foundID; index++)
    {
        if (todosArr[index].id == param_id)
        {
            foundID = true;
        }
    }

    if (!foundID)
    {
        endTime = performance.now();
        duration = endTime - startTime;
        requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
        + " duration: " + duration + "ms");

        checkID = false;
        todosLogger.error({reqId: logsCounter++}, `Error: no such TODO with id ${param_id}`);
        res.status(404).json({result:"",errorMessage:`Error: no such TODO with id ${param_id}`});
    }

    else if (checkID)
    {
        todosLogger.info({reqId: logsCounter}, `Removing todo id ${param_id}`);

        todosArr[param_id - 1] = {};
        logArrSize--;

        todosLogger.debug({reqId: logsCounter}, `After removing todo id [${param_id}] there are ${logArrSize} TODOs in the system`);

        endTime = performance.now();
        duration = endTime - startTime;
        requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
        + " duration: " + duration + "ms");

        logsCounter++;

        res.status(200).json({result:logArrSize,errorMessage:""});
    }
  });
  ////////////////////////////////////Phase 7////////////////////////////////////
  app.get('/logs/level', (req, res) =>
  {
    startTime = performance.now();
    let loggerName = req.query['logger-name'], resLevel;

    if (loggerName != "request-logger" && loggerName != "todo-logger")
    {
        res.status(400).send(`Bad Request: No such logger named ${loggerName}`);
    }

    else
    {
        requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
        " | resource: /logs/level | HTTP Verb GET");

        if (loggerName == "request-logger")
        {
            resLevel = requestsLogger.level();
        }

        else
        {
            resLevel = todosLogger.level();
        }

        endTime = performance.now();
        duration = endTime - startTime;
        requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
        + " duration: " + duration + "ms");
        logsCounter++;

        res.status(200).send(resLevel.toUpperCase());
    }
  });
  ////////////////////////////////////Phase 8////////////////////////////////////
  app.put('/logs/level', (req, res) =>
  {
    startTime = performance.now();
    let loggerName = req.query['logger-name'], desiredLevel = req.query['logger-level'];

    if (loggerName != "request-logger" && loggerName != "todo-logger")
    {
        res.status(400).send(`Bad Request: No such logger named ${loggerName}`);
    }

    else if (desiredLevel != "INFO" && desiredLevel != "DEBUG" && desiredLevel != "ERROR")
    {
        res.status(400).send(`Bad Request: Invalid level ${desiredLevel}`);
    }

    else
    {
        requestsLogger.info({reqId: logsCounter}, "Incoming request | #" + logsCounter +
        " | resource: /logs/level | HTTP Verb PUT");
        
        if (loggerName == "request-logger")
        {
            resLevel = requestsLogger.level(desiredLevel);
        }

        else
        {
            resLevel = todosLogger.level(desiredLevel);
        }

        endTime = performance.now();
        duration = endTime - startTime;
        requestsLogger.debug({reqId: logsCounter}, "request #" + logsCounter 
        + " duration: " + duration + "ms");
        logsCounter++;

        res.status(200).send(desiredLevel);
    }
  });
  ////////////////////////////////////End of code////////////////////////////////////