const url=(c,method)=>`${c.apiUrl||'https://api.green-api.com'}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}`;

export async function sendMessage(c,chatId,message){
  const r=await fetch(url(c,'sendMessage'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chatId,message})});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json(); // {idMessage}
}
export async function receive(c){
  const r=await fetch(url(c,'receiveNotification')+'?receiveTimeout=5');
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json(); // null, если очередь пуста
}
export async function remove(c,receiptId){
  await fetch(`${url(c,'deleteNotification')}/${receiptId}`,{method:'DELETE'});
}
export async function checkAccount(c,body){
  const r=await fetch(url(c,'checkAccount'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json(); // {exist, chatId, phoneNumber}
}
