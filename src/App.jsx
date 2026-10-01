import {useEffect,useRef,useState} from 'react';
import {sendMessage,receive,remove,checkAccount} from './api';

const textOf=m=>m?.textMessageData?.textMessage??m?.extendedTextMessageData?.text??null;
const time=ts=>new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});

export default function App(){
  const [creds,setCreds]=useState(()=>JSON.parse(sessionStorage.getItem('creds')||'null'));
  if(!creds) return <Login onLogin={c=>{sessionStorage.setItem('creds',JSON.stringify(c));setCreds(c);}}/>;
  return <Chat creds={creds} onExit={()=>{sessionStorage.removeItem('creds');setCreds(null);}}/>;
}

function Login({onLogin}){
  const [f,setF]=useState({idInstance:'',apiTokenInstance:'',apiUrl:''});
  const set=k=>e=>setF({...f,[k]:e.target.value.trim()});
  return(
    <div className="login">
      <form onSubmit={e=>{e.preventDefault();onLogin(f);}}>
        <h1>Вход в чат</h1>
        <p>Данные из личного кабинета GREEN-API</p>
        <input placeholder="idInstance" value={f.idInstance} onChange={set('idInstance')} required/>
        <input placeholder="apiTokenInstance" type="password" value={f.apiTokenInstance} onChange={set('apiTokenInstance')} required/>
        <input placeholder="apiUrl (необязательно)" value={f.apiUrl} onChange={set('apiUrl')}/>
        <button>Войти</button>
      </form>
    </div>
  );
}

function Chat({creds,onExit}){
  const [chats,setChats]=useState({});
  const [active,setActive]=useState(null);
  const [phone,setPhone]=useState('');
  const [text,setText]=useState('');
  const [err,setErr]=useState('');
  const endRef=useRef();

  const add=(id,title,msg)=>setChats(c=>{
    const cur=c[id]||{title,msgs:[]};
    if(msg&&cur.msgs.some(m=>m.id===msg.id)) return c;
    return {...c,[id]:{title:cur.title||title,msgs:msg?[...cur.msgs,msg]:cur.msgs}};
  });

  // Получение: receiveNotification -> обработка -> deleteNotification
  useEffect(()=>{
    let stop=false;
    (async()=>{
      while(!stop){
        try{
          const n=await receive(creds);
          if(!n) continue;
          const b=n.body, t=textOf(b?.messageData);
          if(b?.typeWebhook==='incomingMessageReceived'&&t){
            const s=b.senderData;
            add(s.chatId,s.senderName||s.chatId,{id:b.idMessage,out:false,text:t,ts:b.timestamp*1000});
          }
          await remove(creds,n.receiptId);
          setErr('');
        }catch(e){
          setErr('Нет связи с GREEN-API: '+e.message);
          await new Promise(r=>setTimeout(r,3000));
        }
      }
    })();
    return()=>{stop=true;};
  },[creds]);

  useEffect(()=>{endRef.current?.scrollIntoView({block:'end'});},[chats,active]);

  const newChat=async e=>{
    e.preventDefault();
    const v=phone.trim(), isName=v.startsWith('@');
    const d=v.replace(/\D/g,'');
    if(!isName&&d.length<10) return setErr('Введите номер в международном формате, например 79991234567');
    try{
      // Telegram: сначала получаем chatId по номеру (или @username), потом пишем по chatId
      const r=await checkAccount(creds,isName?{username:v}:{phoneNumber:Number(d)});
      if(!r.chatId) return setErr('Аккаунт Telegram не найден (или скрыт настройками приватности)');
      add(r.chatId,isName?v:'+'+d); setActive(r.chatId); setPhone(''); setErr('');
    }catch(x){setErr('Не удалось создать чат: '+x.message);}
  };

  const send=async e=>{
    e.preventDefault();
    const t=text.trim(); if(!t||!active) return;
    setText('');
    try{
      const r=await sendMessage(creds,active,t);
      add(active,'',{id:r.idMessage,out:true,text:t,ts:Date.now()});
    }catch(x){setErr('Не отправлено: '+x.message);setText(t);}
  };

  const cur=active&&chats[active];
  return(
    <div className={'app'+(active?' open':'')}>
      <aside>
        <header><b>Чаты</b><button className="link" onClick={onExit}>Выйти</button></header>
        <form className="new" onSubmit={newChat}>
          <input placeholder="Номер 79991234567 или @username" value={phone} onChange={e=>setPhone(e.target.value)} />
          <button>Создать чат</button>
        </form>
        <ul>
          {Object.entries(chats).map(([id,c])=>(
            <li key={id} className={id===active?'on':''} onClick={()=>setActive(id)}>
              <span className="ava">{c.title.replace('+','')[0]}</span>
              <div><b>{c.title}</b><small>{c.msgs.at(-1)?.text||'Нет сообщений'}</small></div>
            </li>
          ))}
          {!Object.keys(chats).length&&<li className="empty">Введите номер, чтобы начать чат</li>}
        </ul>
      </aside>
      <main>
        {cur?<>
          <header><button className="link back" onClick={()=>setActive(null)}>←</button><b>{cur.title}</b></header>
          <div className="msgs">
            {cur.msgs.map(m=>(
              <div key={m.id} className={'msg '+(m.out?'out':'in')}>{m.text}<small>{time(m.ts)}</small></div>
            ))}
            <div ref={endRef}/>
          </div>
          <form className="send" onSubmit={send}>
            <input placeholder="Сообщение" value={text} onChange={e=>setText(e.target.value)} autoFocus/>
            <button disabled={!text.trim()}>➤</button>
          </form>
        </>:<div className="blank">Выберите чат или создайте новый</div>}
        {err&&<div className="err" onClick={()=>setErr('')}>{err}</div>}
      </main>
    </div>
  );
}
