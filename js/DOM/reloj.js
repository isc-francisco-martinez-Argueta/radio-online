const d=document;
export function  digitalClock(clock){
    
    setInterval(() => {
        let clockHour= new Date().toLocaleTimeString();

        
            
            d.querySelector(clock).innerHTML=`<h3>${clockHour}</h3>`;
       
        
    }, 1000);
    
}
    