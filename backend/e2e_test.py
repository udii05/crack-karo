import json
import os
import sys
import urllib.request
import urllib.error

BASE = os.environ.get("E2E_BASE", "http://localhost:8000")


def req(method, path, token=None, body=None, timeout=15):
    url = f"{BASE}{path}"
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]


def main():
    import time
    email = f"e2e{int(time.time())}@test.com"
    code, reg = req("POST", "/api/auth/register", body={
        "email": email, "password": "secret123", "full_name": "E2E User"})
    assert code == 201, f"register failed: {code} {reg}"
    token = reg["access_token"]
    print("1) REGISTER OK ->", reg["user"]["email"])

    code, dash = req("GET", "/api/dashboard", token=token)
    assert code == 200
    print(f"2) DASHBOARD (fresh): readiness={dash['readiness']} streak={dash['streak']} skills={len(dash['skills'])}")

    code, iv = req("POST", "/api/interviews", token=token, body={
        "type": "behavioral", "difficulty": "intermediate",
        "title": "E2E Mock", "question_count": 3})
    assert code == 201, f"interview create failed: {code} {iv}"
    iid = iv["id"]
    print(f"3) INTERVIEW CREATED: id={iid} sessions={len(iv['sessions'])}")

    for s in iv["sessions"]:
        code, upd = req("POST", f"/api/interviews/{iid}/answer", token=token, body={
            "answer": "I led a migration to AWS, coordinated teams, and we cut costs by 30%. "
                      "I learned that clear communication drives results."})
        assert code == 200, f"answer failed: {code} {upd}"
        answered = [x for x in upd["sessions"] if x["user_answer"]]
        last = answered[-1]
        print(f"   answered={len(answered)}/3 score={last['score']} feedback={last['feedback']['summary'][:50]}")

    code, done = req("POST", f"/api/interviews/{iid}/complete", token=token)
    assert code == 200
    print(f"4) COMPLETED: status={done['status']} overall={done['overall_score']} summary={done['report']['summary']}")

    code, dash2 = req("GET", "/api/dashboard", token=token)
    assert code == 200
    print(f"5) DASHBOARD (after): readiness={dash2['readiness']} streak={dash2['streak']} "
          f"completed={dash2['interviews_completed']} avg={dash2['avg_score']}")

    code, hint = req("POST", "/api/copilot/hint", token=token, body={
        "context": "Senior Engineer interview", "transcript": "Tell me about a leadership story."})
    assert code == 200
    print(f"6) COPILOT OK: points={len(hint['talking_points'])} star={list(hint['star_outline'].keys())}")

    code, qs = req("GET", "/api/questions", token=token)
    assert code == 200
    print(f"7) QUESTION BANK: {len(qs)} questions")

    print("\n=== ALL E2E CHECKS PASSED ===")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("E2E FAILED:", e)
        sys.exit(1)
